import json
from datetime import datetime, timezone
from agent.state import WatcherState
from metrics.deepeval_runner import _throttled_groq_call

JUDGE_MODEL = "llama-3.3-70b-versatile"


def invoke(state: WatcherState) -> WatcherState:
    """
    Analyzes scored_results to identify specific failure patterns.
    Groups failing test cases by failure type.
    Produces actionable root cause text.

    If no regression detected: skips analysis, logs done.
    If regression detected: calls Groq judge to cluster failures
    and produce a 2-3 sentence actionable diagnosis.
    """
    try:
        trace = state.setdefault("agent_trace", [])

        # If no regression, skip gracefully
        if not state.get("regression_found", False):
            state["root_cause"] = "No regression detected — root cause analysis skipped."
            state["failure_clusters"] = []
            trace.append(
                {
                    "node": "root_cause_analysis",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "summary": "Skipped — no regression detected.",
                    "status": "done",
                }
            )
            return state

        # Build failure summary from scored_results
        scored = state.get("scored_results", [])
        total = len(scored)
        failing = [r for r in scored if not r.get("passed", True)]

        if not failing:
            # Regression found but no individual failures — edge case
            state["root_cause"] = (
                "Overall score dropped below threshold but no individual test cases failed. "
                "This may indicate borderline scoring across all cases."
            )
            state["failure_clusters"] = ["borderline-scoring"]
            trace.append(
                {
                    "node": "root_cause_analysis",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "summary": (
                        "Regression detected but no individual failures found — "
                        "borderline scoring."
                    ),
                    "status": "done",
                }
            )
            return state

        # Build concise failure details for Groq
        # Keep payload small — only what the judge needs
        failure_details = []
        for case in failing:
            scores = case.get("scores", {})
            reasons = case.get("reasons", {})

            # Find the worst performing metric
            if scores:
                worst_metric = min(scores, key=lambda m: scores.get(m, 1.0))
                worst_score = scores.get(worst_metric, 0.0)
                worst_reason = reasons.get(worst_metric, "No reason provided")
            else:
                worst_metric = "unknown"
                worst_score = 0.0
                worst_reason = "No scoring data available"

            failure_details.append(
                {
                    "test_case_id": case.get("id", "unknown"),
                    "overall_score": round(case.get("overall_score", 0.0), 3),
                    "worst_metric": worst_metric,
                    "worst_score": round(worst_score, 3),
                    "judge_reason": worst_reason,
                }
            )

        prompt = f"""You are analyzing why an AI model failed an evaluation suite.

Total test cases: {total}
Failed test cases: {len(failing)}
Judge model: {JUDGE_MODEL}

Failed case details:
{json.dumps(failure_details, indent=2)}

Analyze these failures and identify patterns. Respond ONLY with this exact JSON object.
No markdown fences. No explanation outside the JSON. Just the JSON:

{{
  "primary_cluster": "brief 5-10 word description of the main failure pattern",
  "secondary_clusters": ["second pattern if any", "third pattern if any"],
  "root_cause": "2-3 sentence specific diagnosis. Name the exact failure pattern. State which metric is worst. Give one actionable recommendation.",
  "confidence": "high"
}}

Rules:
- primary_cluster must be specific, not generic. Bad: "model errors". Good: "under-triaging high-acuity cardiac presentations"
- root_cause must be actionable — something a developer can act on
- secondary_clusters can be empty array [] if only one pattern exists
- confidence is always "high" unless fewer than 2 failures"""

        raw = _throttled_groq_call(prompt)

        # Strip markdown fences if present
        clean = raw.strip()
        if "```" in clean:
            for part in clean.split("```"):
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    clean = part
                    break

        parsed = json.loads(clean)

        root_cause = str(parsed.get("root_cause", "Unable to determine root cause."))
        primary = str(parsed.get("primary_cluster", "unknown-pattern"))
        secondary = [str(s) for s in parsed.get("secondary_clusters", [])]
        confidence = str(parsed.get("confidence", "high"))

        state["root_cause"] = root_cause
        state["failure_clusters"] = [primary] + secondary

        summary = (
            f"Root cause identified: {primary}. "
            f"Confidence: {confidence}. "
            f"{len(failing)} of {total} cases failed."
        )

        trace.append(
            {
                "node": "root_cause_analysis",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "summary": summary,
                "status": "done",
            }
        )
        return state
    except Exception as e:
        # Never let root cause failure kill the agent run
        state["root_cause"] = f"Root cause analysis encountered an error: {str(e)}"
        state["failure_clusters"] = ["analysis-error"]
        state.setdefault("agent_trace", []).append(
            {
                "node": "root_cause_analysis",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "summary": f"Root cause analysis failed: {str(e)}",
                "status": "done",
            }
        )
        return state
