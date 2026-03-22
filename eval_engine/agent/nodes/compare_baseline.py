from agent.state import WatcherState
from datetime import datetime, timezone

def invoke(state: WatcherState) -> WatcherState:
    """
    Node 5: Compare new score vs baseline and threshold.
    Sets regression_found and decision.
    """
    overall = state["overall_score"]
    previous = state.get("previous_score", 0.0)
    threshold = state["threshold"]

    regression_found = overall < threshold
    decision = "FAIL" if regression_found else "PASS"

    state["regression_found"] = regression_found
    state["decision"] = decision

    delta = round(overall - previous, 4)
    delta_str = f"+{delta}" if delta >= 0 else str(delta)

    state["agent_trace"].append({
        "node": "compare_baseline",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": (
            f"Score {previous:.2f} → {overall:.2f} ({delta_str}). "
            f"Threshold: {threshold:.2f}. "
            f"Decision: {decision}. "
            f"{'⚠️ REGRESSION DETECTED' if regression_found else '✅ Quality maintained'}"
        ),
        "status": "done"
    })
    return state
