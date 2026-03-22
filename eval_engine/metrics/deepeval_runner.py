# eval_engine/metrics/deepeval_runner.py
"""
Veridian Custom Eval Engine
Judge: llama-3.3-70b-versatile at temperature=0 (deterministic)
Structured rubrics tuned for healthcare, BFSI, and hiring domains.
2.5s throttle prevents Groq rate limit errors.
One metric failure never kills the entire run.
DO NOT import deepeval — this file replaces it entirely.
"""
import os
import json
import time
from groq import Groq

_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
JUDGE_MODEL = "llama-3.3-70b-versatile"

MIN_GAP_SECONDS = 2.5
_last_call_time = 0.0


def _throttled_groq_call(prompt: str) -> str:
    global _last_call_time
    elapsed = time.time() - _last_call_time
    if elapsed < MIN_GAP_SECONDS:
        time.sleep(MIN_GAP_SECONDS - elapsed)
    _last_call_time = time.time()
    try:
        response = _client.chat.completions.create(
            model=JUDGE_MODEL,
            messages=[
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
            ],
            temperature=0,
            max_tokens=300,
        )
        _last_call_time = time.time()
        return response.choices[0].message.content
    except Exception as e:
        _last_call_time = time.time()
        raise RuntimeError(f"Groq judge call failed: {str(e)}")


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


def _score_answer_relevancy(tc: dict) -> tuple[float, str]:
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
    raw = _throttled_groq_call(prompt)
    return _parse_judge_response(raw, "answer_relevancy")


def _score_hallucination(tc: dict) -> tuple[float, str]:
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
    raw = _throttled_groq_call(prompt)
    return _parse_judge_response(raw, "hallucination")


def _score_faithfulness(tc: dict) -> tuple[float, str]:
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
    raw = _throttled_groq_call(prompt)
    return _parse_judge_response(raw, "faithfulness")


def _score_correctness(tc: dict) -> tuple[float, str]:
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
    raw = _throttled_groq_call(prompt)
    return _parse_judge_response(raw, "correctness")


_SCORERS = {
    "answer_relevancy": _score_answer_relevancy,
    "hallucination": _score_hallucination,
    "faithfulness": _score_faithfulness,
    "correctness": _score_correctness,
}


def run_deepeval(test_cases_payload: list[dict]) -> list[dict]:
    """
    Veridian Eval Engine entry point.
    Input:  list of dicts with keys: id, input, expected_output, actual_output, context
    Output: list of dicts with keys: id, passed, scores, reasons, overall_score
    One metric failure never kills the run — failures are isolated per metric.
    """
    metrics = ["answer_relevancy", "hallucination", "faithfulness", "correctness"]
    results = []

    for tc in test_cases_payload:
        scores = {}
        reasons = {}

        for metric in metrics:
            scorer = _SCORERS.get(metric)
            if not scorer:
                scores[metric] = 0.0
                reasons[metric] = f"Unknown metric: {metric}"
                continue
            try:
                score, reason = scorer(tc)
                scores[metric] = score
                reasons[metric] = reason
            except Exception as e:
                scores[metric] = 0.0
                reasons[metric] = f"Metric evaluation error: {str(e)}"

        overall = round(sum(scores.values()) / len(scores), 4) if scores else 0.0
        passed = overall >= 0.5

        results.append({
            "id": tc["id"],
            "passed": passed,
            "scores": scores,
            "reasons": reasons,
            "overall_score": overall,
        })

    return results
