from agent.state import WatcherState
from models.groq_client import call_groq
from datetime import datetime, timezone

def invoke(state: WatcherState) -> WatcherState:
    """
    Node 6: Generate a natural language report using Groq LLM.
    Uses llama-3.3-70b-versatile for report generation.
    Produces 2-3 sentence summary with actionable recommendation.
    """
    scored = state.get("scored_results", [])
    overall = state["overall_score"]
    previous = state.get("previous_score", 0.0)
    threshold = state["threshold"]
    decision = state["decision"]
    model_id = state["new_model_id"]

    failed_cases = [r for r in scored if not r["passed"]]

    metric_summary = ""
    if scored:
        all_scores = {}
        for r in scored:
            for metric, score in r.get("scores", {}).items():
                all_scores.setdefault(metric, []).append(score)
        metric_summary = ", ".join(
            f"{m}: {round(sum(v)/len(v), 2)}"
            for m, v in all_scores.items()
        )

    prompt = f"""You are an AI quality assurance engineer writing a technical regression report.

Model evaluated: {model_id}
Previous score: {previous:.2f}
New score: {overall:.2f}
Quality threshold: {threshold:.2f}
Decision: {decision}
Failed test cases: {len(failed_cases)} of {len(scored)}
Average metric scores: {metric_summary}

Write a 2-3 sentence technical report summary that:
1. States what happened to the quality score
2. Identifies the main quality issue (which metrics failed most)
3. Gives a clear actionable recommendation

Be specific and technical. Do not use bullet points. Write in plain sentences."""

    try:
        result = call_groq(
            model_id="llama-3.3-70b-versatile",
            prompt=prompt,
            system="You are a technical AI quality assurance engineer. Write concise, actionable reports.",
            temperature=0.3,
        )
        report = result["output"].strip()
    except Exception as e:
        report = (
            f"Quality score changed from {previous:.2f} to {overall:.2f} "
            f"({'below' if overall < threshold else 'above'} threshold {threshold:.2f}). "
            f"Decision: {decision}. "
            f"{len(failed_cases)} of {len(scored)} test cases failed evaluation."
        )

    state["report_summary"] = report

    state["agent_trace"].append({
        "node": "generate_report",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": f"Report generated — {len(report)} chars. Decision: {decision}",
        "status": "done"
    })
    return state
