from agent.state import WatcherState
from models.groq_client import call_groq
from datetime import datetime, timezone

def invoke(state: WatcherState) -> WatcherState:
    """
    Node 3: Run each test case through the new model.
    Uses throttled call_groq() — 2.5s gap between calls.
    Sequential for loop — never parallel.
    Stores { id, actual_output, latency_ms } per test case.
    """
    test_cases = state["eval_suite"]["test_cases"]
    model_id = state["new_model_id"]
    results = []

    for tc in test_cases:
        try:
            system = (
                f"You are a helpful AI assistant. "
                f"Use this context to answer: {tc['context']}"
                if tc.get("context")
                else "You are a helpful AI assistant. Answer accurately and concisely."
            )
            result = call_groq(
                model_id=model_id,
                prompt=tc["input"],
                system=system,
                temperature=0.1,
            )
            results.append({
                "id": tc["id"],
                "actual_output": result["output"],
                "latency_ms": result["latency_ms"],
            })
        except Exception as e:
            results.append({
                "id": tc["id"],
                "actual_output": f"[Model error: {str(e)}]",
                "latency_ms": 0,
            })

    state["test_results"] = results

    state["agent_trace"].append({
        "node": "run_model",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": (
            f"Ran {len(results)} test cases against {model_id}. "
            f"Avg latency: {int(sum(r['latency_ms'] for r in results) / max(len(results), 1))}ms"
        ),
        "status": "done"
    })
    return state
