# eval_engine/agent/nodes/notify.py
import httpx
import asyncio
from datetime import datetime, timezone
from ..state import WatcherState

MAX_RETRIES = 5
RETRY_DELAYS_SECONDS = [2, 4, 8, 16, 32]  # Exponential backoff


async def _post_with_retry(url: str, payload: dict) -> bool:
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt, delay in enumerate(RETRY_DELAYS_SECONDS[:MAX_RETRIES]):
            try:
                response = await client.post(url, json=payload)
                if response.status_code in (200, 201, 409):
                    return True
                print(
                    f"[notify] Attempt {attempt + 1}: got HTTP {response.status_code}, "
                    f"retrying in {delay}s"
                )
            except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
                print(f"[notify] Attempt {attempt + 1}: network error ({e}), retrying in {delay}s")

            await asyncio.sleep(delay)

    print(f"[notify] All {MAX_RETRIES} attempts exhausted. Callback delivery FAILED.")
    return False


def invoke(state: WatcherState) -> WatcherState:
    # 1. Append trace FIRST — before doing anything else
    state["agent_trace"].append({
        "node": "notify",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": "Delivering results to Next.js callback...",
        "status": "done"
    })

    payload = {
        "agent_run_id":     state["agent_run_id"],
        "new_score":        state["overall_score"],
        "previous_score":   state["previous_score"],
        "regression_found": state["regression_found"],
        "decision":         state["decision"],
        "report_summary":   state["report_summary"],
        "agent_trace":      state["agent_trace"],  # includes notify node
        "scored_results":   state["scored_results"],
    }

    callback_url = state["callback_url"]
    success = asyncio.run(_post_with_retry(callback_url, payload))

    # 2. Update the notify trace entry summary
    state["agent_trace"][-1]["summary"] = (
        f"Callback {'delivered successfully' if success else 'FAILED after all retries'}. "
        f"Slack {'alert sent' if state.get('regression_found') else 'skipped (no regression)'}."
    )

    # 3. Handle Slack (keep existing logic)
    if state["regression_found"] and state.get("slack_webhook_url"):
        slack_payload = {
            "text": (
                f":rotating_light: *Regression detected* — {state['decision']}\n"
                f"Score: `{state['previous_score']:.2f}` → `{state['overall_score']:.2f}` "
                f"(threshold: `{state['threshold']:.2f}`)\n"
                f"_{state['report_summary']}_"
            )
        }
        try:
            asyncio.run(
                httpx.AsyncClient().post(state["slack_webhook_url"], json=slack_payload)
            )
        except Exception as e:
            print(f"[notify] Slack notification failed (non-fatal): {e}")

    return state
