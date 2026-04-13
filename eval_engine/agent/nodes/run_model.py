import time
from datetime import datetime, timezone

from agent.state import WatcherState
from provider_pool import groq_pool, gemini_pool
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Gemini model IDs — extend this list if new Gemini models are added
GEMINI_MODEL_PREFIXES = ("gemini-",)


def _is_gemini_model(model_id: str) -> bool:
    return any(model_id.startswith(prefix) for prefix in GEMINI_MODEL_PREFIXES)


def _evaluate_worker(tc: dict, model_id: str, key_index: int) -> dict:
    messages = [
        {
            "role": "system",
            "content": "You are a helpful AI assistant. Answer accurately and concisely.",
        },
        {"role": "user", "content": tc["input"]},
    ]
    if tc.get("context"):
        messages[0]["content"] += f" Use this context to answer: {tc['context']}"

    start = time.time()
    try:
        if _is_gemini_model(model_id):
            output = gemini_pool.run_model(model_id, messages, temperature=0.1)
        else:
            output = groq_pool.call_with_key(key_index, model_id, messages, temperature=0.1, max_tokens=1024)

        latency_ms = int((time.time() - start) * 1000)
        return {
            "id": tc["id"],
            "actual_output": output,
            "latency_ms": latency_ms,
        }
    except Exception as e:
        return {
            "id": tc["id"],
            "actual_output": f"[Model error: {str(e)}]",
            "latency_ms": int((time.time() - start) * 1000),
        }

def invoke(state: WatcherState) -> WatcherState:
    """
    Node 3: Run each test case through the selected model.
    Routes between Groq and Gemini based on model ID prefix.
    Parallel execution across 3 GroqPool keys via ThreadPoolExecutor.
    Stores { id, actual_output, latency_ms } per test case.
    """
    model_id = state["new_model_id"]
    test_cases = state["eval_suite"]["test_cases"]
    results = []

    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {
            executor.submit(_evaluate_worker, tc, model_id, i % 3): tc
            for i, tc in enumerate(test_cases)
        }
        for future in as_completed(futures):
            results.append(future.result())

    # Sort results to match original order
    tc_order = {tc["id"]: i for i, tc in enumerate(test_cases)}
    results.sort(key=lambda x: tc_order.get(x["id"], 0))

    state["test_results"] = results

    state["agent_trace"].append({
        "node": "run_model",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": (
            f"Ran {len(results)} test cases against {model_id}. "
            f"Avg latency: {int(sum(r['latency_ms'] for r in results) / max(len(results), 1))}ms"
        ),
        "status": "done",
    })
    return state
