# eval_engine/agent/nodes/notify.py
import httpx
import asyncio
import logging
import os
from urllib.parse import urlparse
from datetime import datetime, timezone
from ..state import WatcherState

MAX_RETRIES = 5
RETRY_DELAYS_SECONDS = [2, 4, 8, 16, 32]  # Exponential backoff
logger = logging.getLogger(__name__)


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
        "status": "running"
    })

    payload = {
        "agent_run_id":     state["agent_run_id"],
        "new_score":        state["overall_score"],
        "previous_score":   state["previous_score"],
        "regression_found": state["regression_found"],
        "decision":         state["decision"],
        "report_summary":   state["report_summary"],
        "root_cause":       state.get("root_cause", ""),
        "agent_trace":      state["agent_trace"],  # includes notify node
        "scored_results":   state["scored_results"],
    }

    callback_url = state["callback_url"]
    success = asyncio.run(_post_with_retry(callback_url, payload))

    slack_notified = False
    telegram_notified = False

    if success:
        if state.get("slack_channel_id"):
            try:
                slack_payload = {
                    "channelId": state["slack_channel_id"],
                    "agentRunId": state["agent_run_id"],
                }

                async def _notify_slack():
                    parsed = urlparse(callback_url)
                    web_app_url = f"{parsed.scheme}://{parsed.netloc}"
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        r = await client.post(
                            f"{web_app_url}/api/slack/notify",
                            json=slack_payload,
                        )
                        return r.status_code < 300

                slack_notified = asyncio.run(_notify_slack())
            except Exception as e:
                logger.warning(f"Slack notification failed: {e}")

        if state.get("telegram_chat_id"):
            try:
                telegram_payload = {
                    "chatId": state["telegram_chat_id"],
                    "agentRunId": state["agent_run_id"],
                }

                async def _notify_telegram():
                    parsed = urlparse(callback_url)
                    web_app_url = f"{parsed.scheme}://{parsed.netloc}"
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        r = await client.post(
                            f"{web_app_url}/api/telegram/notify",
                            json=telegram_payload,
                        )
                        return r.status_code < 300

                telegram_notified = asyncio.run(_notify_telegram())
            except Exception as e:
                logger.warning(f"Telegram notification failed: {e}")

    state["agent_trace"][-1].update({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": (
            f"Callback {'delivered' if success else 'FAILED'}. "
            f"Slack: {'sent' if slack_notified else 'skipped' if not state.get('slack_channel_id') else 'failed'}. "
            f"Telegram: {'sent' if telegram_notified else 'skipped' if not state.get('telegram_chat_id') else 'failed'}."
        ),
        "status": "done" if success else "error",
    })

    return state
