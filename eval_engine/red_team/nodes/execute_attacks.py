"""
execute_attacks.py — Parallel attack execution against target model
Architecture: 42 attacks split across 3 workers (14 each), all in parallel.
Each worker pinned to one key, calls the USER-SELECTED target model.
Was: 70 sequential calls on 1 key (~175s). Now: 42 parallel calls on 3 keys (~35s).
"""
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from provider_pool import groq_pool

MIN_GAP = 2.5


def _execute_worker(batch: list, target_model: str, key_index: int) -> list:
    """
    Worker pinned to one key. Executes its batch sequentially with 2.5s gap.
    key_index 0,1 → runner clients; key_index 2 → judge client (borrowed during red team).
    """
    results = []
    last_call = 0.0

    for item in batch:
        elapsed = time.time() - last_call
        if elapsed < MIN_GAP:
            time.sleep(MIN_GAP - elapsed)

        messages = [{"role": "user", "content": item["attack"]}]

        try:
            response = groq_pool.call_with_key(
                key_index, target_model, messages, temperature=0.1, max_tokens=1024
            )
        except Exception as e:
            response = f"[execution error: {str(e)}]"

        last_call = time.time()
        results.append({
            "category":     item["category"],
            "test_case_id": item["test_case_id"],
            "attack":       item["attack"],
            "response":     response,
        })

    return results


def invoke(state):
    target_model = state["target_model_id"]
    test_cases   = state["test_cases"]

    # Flatten all (category, attack) pairs into one list with metadata
    all_attacks = []
    for category, attacks in state["generated_attacks"].items():
        for i, attack in enumerate(attacks):
            if i < len(test_cases):
                all_attacks.append({
                    "category":     category,
                    "test_case_id": test_cases[i]["id"],
                    "attack":       attack,
                })

    # Split evenly across 3 workers
    n = len(all_attacks)
    chunk = n // 3
    batches = [
        all_attacks[0:chunk],
        all_attacks[chunk:chunk*2],
        all_attacks[chunk*2:],
    ]

    all_results = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(_execute_worker, batches[i], target_model, i)
            for i in range(3)
        ]
        for future in as_completed(futures):
            try:
                all_results.extend(future.result())
            except Exception as e:
                print(f"[execute_attacks] Worker failed: {e}")

    # Group by category
    attack_results = {}
    for r in all_results:
        attack_results.setdefault(r["category"], []).append(r)

    state["attack_results"] = attack_results
    state["agent_trace"].append({
        "node": "execute_attacks",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": f"Executed {len(all_results)} attacks against {target_model} using 3 parallel workers.",
        "status": "done",
    })
    return state
