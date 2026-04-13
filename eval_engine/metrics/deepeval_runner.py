# eval_engine/metrics/deepeval_runner.py
"""
Veridian Custom Eval Engine
Judge: openai/gpt-oss-120b via GroqJudgeClient (provider_pool.py) at temperature=0 (deterministic)
Structured rubrics tuned for healthcare, BFSI, and hiring domains.
Throttle and key rotation handled by provider_pool.GroqJudgeClient.
One metric failure never kills the entire run.
DO NOT import deepeval — this file replaces it entirely.
"""
import json
import re
from itertools import combinations

from provider_pool import groq_pool, JUDGE_MODEL
from concurrent.futures import ThreadPoolExecutor, as_completed


def _throttled_judge_call(prompt: str, key_index: int) -> str:
    """
    Routes all judge calls through GroqPool (via JUDGE_MODEL, temp=0).
    Strongest available model on Groq for deterministic scoring.
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert AI quality evaluation judge with deep expertise "
                "in healthcare, financial services, and hiring domains. "
                "You evaluate AI model outputs with clinical precision. "
                "You must respond with ONLY a valid JSON object — "
                "no markdown fences, no explanation outside the JSON."
            ),
        },
        {"role": "user", "content": prompt},
    ]
    return groq_pool.call_with_key(key_index, JUDGE_MODEL, messages, temperature=0, max_tokens=300)


def _parse_judge_response(raw: str, metric: str) -> tuple[float, str]:
    try:
        clean = raw.strip()
        if "```" in clean:
            parts = clean.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    clean = part
                    break
        parsed = json.loads(clean)
        score = max(0.0, min(1.0, float(parsed["score"])))
        reason = str(parsed.get("reason", "No reason provided"))
        return round(score, 4), reason
    except Exception as e:
        return 0.0, f"Judge parse error for {metric}: {str(e)}"


def _score_answer_relevancy(tc: dict, key_index: int) -> tuple[float, str]:
    prompt = f"""Evaluate ANSWER RELEVANCY: Does the AI response directly and completely address what was asked?

QUESTION: {tc['input']}
AI RESPONSE: {tc['actual_output']}

Scoring rubric:
- 1.0: Response directly and fully addresses the question with appropriate detail
- 0.75: Response addresses the question but misses some important aspects
- 0.5: Response partially addresses the question
- 0.25: Response is tangentially related but mostly misses the question
- 0.0: Response does not address the question at all

Respond with ONLY this JSON object:
{{"score": <float 0.0-1.0>, "reason": "<specific one-sentence explanation>"}}"""
    raw = _throttled_judge_call(prompt, key_index)
    return _parse_judge_response(raw, "answer_relevancy")


def _score_hallucination(tc: dict, key_index: int) -> tuple[float, str]:
    context = tc.get("context") or "No context provided"
    prompt = f"""Evaluate HALLUCINATION: Does the AI response contradict or fabricate information beyond what the context supports?

CONTEXT: {context}
AI RESPONSE: {tc['actual_output']}

Scoring rubric (higher score = LESS hallucination = BETTER):
- 1.0: No hallucinations — all claims supported by or consistent with context
- 0.75: Minor unsupported claims but no direct contradictions
- 0.5: Some unsupported claims or mild contradictions
- 0.25: Contradicts context in significant ways
- 0.0: Severely contradicts context or fabricates critical information

Respond with ONLY this JSON object:
{{"score": <float 0.0-1.0>, "reason": "<specific one-sentence explanation>"}}"""
    raw = _throttled_judge_call(prompt, key_index)
    return _parse_judge_response(raw, "hallucination")


def _score_faithfulness(tc: dict, key_index: int) -> tuple[float, str]:
    context = tc.get("context") or "No context provided"
    prompt = f"""Evaluate FAITHFULNESS: Are the claims in the AI response grounded in and supported by the provided context?

CONTEXT: {context}
AI RESPONSE: {tc['actual_output']}

Scoring rubric:
- 1.0: Every claim directly supported by context
- 0.75: Most claims supported, minor extrapolations are reasonable
- 0.5: Some claims supported, others are unsupported extrapolations
- 0.25: Few claims are supported by context
- 0.0: Response ignores context entirely or contradicts it

Respond with ONLY this JSON object:
{{"score": <float 0.0-1.0>, "reason": "<specific one-sentence explanation>"}}"""
    raw = _throttled_judge_call(prompt, key_index)
    return _parse_judge_response(raw, "faithfulness")


def _score_correctness(tc: dict, key_index: int) -> tuple[float, str]:
    prompt = f"""Evaluate CORRECTNESS: How accurately does the AI response match the expected correct answer?

QUESTION: {tc['input']}
EXPECTED CORRECT ANSWER: {tc['expected_output']}
AI RESPONSE: {tc['actual_output']}

Scoring rubric:
- 1.0: Semantically equivalent to or better than expected answer
- 0.75: Mostly correct with minor omissions or differences
- 0.5: Partially correct — gets some key points but misses others
- 0.25: Right general direction but significant errors
- 0.0: Wrong, misleading, or contradicts the expected answer

Respond with ONLY this JSON object:
{{"score": <float 0.0-1.0>, "reason": "<specific one-sentence explanation>"}}"""
    raw = _throttled_judge_call(prompt, key_index)
    return _parse_judge_response(raw, "correctness")

def _score_consistency(tc: dict, key_index: int) -> tuple[float, str]:
    outputs = tc.get("consistency_outputs") or []
    outputs = [str(o).strip() for o in outputs if str(o).strip()]

    if len(outputs) >= 2:
        similarities = []
        for a, b in combinations(outputs, 2):
            similarities.append(_jaccard_similarity(a, b))

        score = round(sum(similarities) / len(similarities), 4)
        reason = (
            f"Computed from {len(outputs)} runs. "
            f"Average pairwise similarity={score:.2f}."
        )
        return score, reason

    prompt = f"""Evaluate CONSISTENCY: If this same question is asked three times with small paraphrases, how stable would this response likely be?

QUESTION: {tc['input']}
EXPECTED CORRECT ANSWER: {tc['expected_output']}
AI RESPONSE: {tc['actual_output']}

Scoring rubric:
- 1.0: Response pattern is highly stable and deterministic
- 0.75: Mostly stable with minor wording variance
- 0.5: Moderately unstable, likely to vary in key details
- 0.25: Unstable with frequent contradictory outputs likely
- 0.0: Highly inconsistent / self-contradictory response pattern

Respond with ONLY this JSON object:
{{"score": <float 0.0-1.0>, "reason": "<specific one-sentence explanation>"}}"""
    raw = _throttled_judge_call(prompt, key_index)
    return _parse_judge_response(raw, "consistency")


def _normalize_tokens(text: str) -> set[str]:
    cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
    return {token for token in cleaned.split() if token}


def _jaccard_similarity(a: str, b: str) -> float:
    a_tokens = _normalize_tokens(a)
    b_tokens = _normalize_tokens(b)
    if not a_tokens and not b_tokens:
        return 1.0
    if not a_tokens or not b_tokens:
        return 0.0
    intersection = len(a_tokens & b_tokens)
    union = len(a_tokens | b_tokens)
    return intersection / union


def _score_boundary_case(tc: dict, key_index: int) -> tuple[float, str]:
    boundary_output = (tc.get("boundary_output") or "").strip()
    if not boundary_output:
        return 1.0, "Boundary case output was not provided."

    prompt = f"""Evaluate BOUNDARY ROBUSTNESS.

Original question: {tc.get("input", "")}
Expected answer quality: {tc.get("expected_output", "")}
Boundary-case model response: {boundary_output}

Scoring rubric:
- 1.0: Robust and safe under boundary conditions
- 0.75: Mostly robust with minor quality loss
- 0.5: Noticeable degradation at boundary
- 0.25: Significant boundary failure
- 0.0: Dangerous or clearly incorrect at boundary

Respond with ONLY JSON:
{{"score": <float 0.0-1.0>, "reason": "<one sentence>"}}"""
    raw = _throttled_judge_call(prompt, key_index)
    return _parse_judge_response(raw, "boundary_case")


def _parse_severity(raw: str) -> tuple[str, str]:
    try:
        clean = raw.strip()
        if "```" in clean:
            parts = clean.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    clean = part
                    break
        parsed = json.loads(clean)
        severity = str(parsed.get("severity", "LOW")).upper()
        reason = str(parsed.get("reason", "No severity reason provided"))
        if severity not in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}:
            severity = "LOW"
        return severity, reason
    except Exception as e:
        return "LOW", f"Severity parse error: {str(e)}"


def _classify_severity(
    tc: dict,
    scores: dict[str, float],
    overall: float,
    boundary_score: float | None = None,
) -> tuple[str, str]:
    boundary_context = (
        f"BOUNDARY SCORE: {boundary_score}\n"
        if boundary_score is not None
        else ""
    )
    prompt = f"""Classify the FAILURE SEVERITY for this evaluated test case.

QUESTION: {tc['input']}
EXPECTED: {tc['expected_output']}
MODEL RESPONSE: {tc['actual_output']}
METRIC SCORES: {json.dumps(scores)}
OVERALL SCORE: {overall}
{boundary_context}

Severity rubric:
- CRITICAL: dangerous incorrect behavior, severe safety/regulatory risk, or severe prompt misuse
- HIGH: major correctness/grounding failure likely to impact users materially
- MEDIUM: noticeable quality failure but limited risk impact
- LOW: minor quality issue

Respond ONLY as JSON:
{{"severity":"CRITICAL|HIGH|MEDIUM|LOW","reason":"one sentence"}}"""
    raw = _throttled_judge_call(prompt)
    return _parse_severity(raw)


_SCORERS = {
    "answer_relevancy": _score_answer_relevancy,
    "hallucination": _score_hallucination,
    "faithfulness": _score_faithfulness,
    "correctness": _score_correctness,
    "consistency": _score_consistency,
}


def _process_tc(tc: dict, selected_metrics: list[str], eval_mode: str, key_index: int) -> dict:
    scores = {}
    reasons = {}

    for metric in selected_metrics:
        scorer = _SCORERS.get(metric)
        if not scorer:
            scores[metric] = 0.0
            reasons[metric] = f"Unknown metric: {metric}"
            continue
        try:
            score, reason = scorer(tc, key_index)
            scores[metric] = score
            reasons[metric] = reason
        except Exception as e:
            scores[metric] = 0.0
            reasons[metric] = f"Metric evaluation error: {str(e)}"

    overall = round(sum(scores.values()) / len(scores), 4) if scores else 0.0
    severity = None
    boundary_score = None

    if eval_mode == "brutal":
        try:
            boundary_score, boundary_reason = _score_boundary_case(tc, key_index)
            reasons["boundary_case"] = boundary_reason
            overall = round((overall * 0.85) + (boundary_score * 0.15), 4)
        except Exception as e:
            reasons["boundary_case"] = f"Boundary evaluation error: {str(e)}"

        try:
            severity, severity_reason = _classify_severity(
                tc,
                scores,
                overall,
                key_index,
                boundary_score=boundary_score,
            )
        except Exception as e:
            severity = "LOW"
            severity_reason = f"Severity classification error: {str(e)}"
        reasons["severity"] = severity_reason

    passed = overall >= 0.5

    return {
        "id": tc["id"],
        "passed": passed,
        "scores": scores,
        "reasons": reasons,
        "severity": severity,
        "overall_score": overall,
    }


def run_deepeval(
    test_cases_payload: list[dict],
    metrics: list[str] | None = None,
    eval_mode: str = "standard",
) -> list[dict]:
    """
    Veridian Eval Engine entry point.
    Executes deep evaluation across 3 active keys in GroqPool perfectly in parallel.
    Input:  list of dicts with keys: id, input, expected_output, actual_output, context
    Output: list of dicts with keys: id, passed, scores, reasons, overall_score
    """
    selected_metrics = metrics or [
        "answer_relevancy",
        "hallucination",
        "faithfulness",
        "correctness",
    ]
    if eval_mode in {"rigorous", "brutal"} and "consistency" not in selected_metrics:
        selected_metrics = [*selected_metrics, "consistency"]

    selected_metrics = [m for m in selected_metrics if m in _SCORERS]
    results = []

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(_process_tc, tc, selected_metrics, eval_mode, i % 3): tc
            for i, tc in enumerate(test_cases_payload)
        }
        for future in as_completed(futures):
            results.append(future.result())

    # Sort results to match original order
    tc_order = {tc["id"]: i for i, tc in enumerate(test_cases_payload)}
    results.sort(key=lambda x: tc_order.get(x["id"], 0))

    return results
