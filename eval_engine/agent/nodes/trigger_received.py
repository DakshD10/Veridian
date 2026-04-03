from agent.state import WatcherState
from datetime import datetime, timezone

def invoke(state: WatcherState) -> WatcherState:
    """
    Node 1: Validate inputs and log the trigger event.
    """
    required = ["agent_run_id", "deployment_id", "trigger_event", 
                "new_model_id", "eval_suite", "threshold"]
    for field in required:
        if not state.get(field):
            raise ValueError(f"Missing required field: {field}")

    state["agent_trace"].append({
        "node": "trigger_received",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": (
            f"Trigger received: {state['trigger_event']}. "
            f"Source: {state.get('trigger_source', 'manual')}. "
            f"New model: {state['new_model_id']}. "
            f"Threshold: {state['threshold']}"
        ),
        "status": "done"
    })
    return state
