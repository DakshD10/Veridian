from agent.state import WatcherState
from datetime import datetime, timezone

def invoke(state: WatcherState) -> WatcherState:
    """
    Node 2: Confirm test cases are present and log the count.
    """
    suite = state.get("eval_suite", {})
    test_cases = suite.get("test_cases", [])

    if not test_cases:
        raise ValueError(f"Eval suite '{suite.get('name', 'unknown')}' has no test cases")

    state["agent_trace"].append({
        "node": "load_eval_suite",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": (
            f"Loaded {len(test_cases)} test cases from "
            f"'{suite.get('name', 'unknown')}' suite"
        ),
        "status": "done"
    })
    return state
