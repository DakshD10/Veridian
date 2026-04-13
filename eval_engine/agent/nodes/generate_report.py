from agent.state import WatcherState
from provider_pool import groq_pool, JUDGE_MODEL
from datetime import datetime, timezone

def invoke(state: WatcherState) -> WatcherState:
    """
    Node 6: Generate a structured markdown regression report using JUDGE_MODEL.
    Produces five-section markdown: Executive Summary, Regression Analysis,
    Metric Breakdown, Root Cause Assessment, Recommended Actions.
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

    report_prompt = f"""You are a senior AI quality engineer writing a regression analysis report.

Deployment: {state['deployment_id']}
Model tested: {model_id}
Baseline score: {previous:.2f}
Current score: {overall:.2f}
Regression detected: {state['regression_found']}
Root cause: {state.get('root_cause', 'Not determined')}
Failed test cases: {len(failed_cases)} of {len(scored)}
Average metric scores: {metric_summary}

Write a structured report with these exact sections:
## Executive Summary
## Regression Analysis
## Metric Breakdown
## Root Cause Assessment
## Recommended Actions

Be specific. Use the scores provided. Keep each section under 100 words.
Do not add any preamble or closing remarks outside these sections."""

    try:
        messages = [{"role": "user", "content": report_prompt}]
        report = groq_pool.call(JUDGE_MODEL, messages, temperature=0.3, max_tokens=2048).strip()
    except Exception as e:
        print(f"[GenerateReport] Failed to generate report: {e}")
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
