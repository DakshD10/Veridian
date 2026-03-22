from agent.state import WatcherState
from metrics.deepeval_runner import run_deepeval
from datetime import datetime, timezone

def invoke(state: WatcherState) -> WatcherState:
    """
    Node 4: Score all test results using Veridian GroqJudge.
    Merges test_results with original test cases to build payload.
    Calls run_deepeval() — uses llama-3.3-70b-versatile at temp=0.
    Stores scored_results with scores + reasons per metric.
    """
    test_cases = {tc["id"]: tc for tc in state["eval_suite"]["test_cases"]}
    test_results = state["test_results"]

    payload = []
    for result in test_results:
        tc = test_cases.get(result["id"], {})
        payload.append({
            "id": result["id"],
            "input": tc.get("input", ""),
            "expected_output": tc.get("expected_output", ""),
            "actual_output": result["actual_output"],
            "context": tc.get("context"),
        })

    scored = run_deepeval(payload)
    state["scored_results"] = scored

    if scored:
        overall = round(
            sum(r["overall_score"] for r in scored) / len(scored), 4
        )
    else:
        overall = 0.0

    state["overall_score"] = overall

    passed = sum(1 for r in scored if r["passed"])
    failed = len(scored) - passed

    state["agent_trace"].append({
        "node": "score_results",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": (
            f"Scored {len(scored)} results using GroqJudge. "
            f"Average score: {overall:.2f}. "
            f"Passed: {passed}, Failed: {failed}"
        ),
        "status": "done"
    })
    return state
