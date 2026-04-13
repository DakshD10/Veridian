"""
notify.py — Red Team callback delivery
POSTs final results to the Next.js callback_url so the web app can update
the RedTeamRun record from "running" to "completed".
Without this node the run stays stuck in "running" forever.
"""
import httpx
import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
MAX_RETRIES = 5
RETRY_DELAYS = [2, 4, 8, 16, 32]


async def _post_with_retry(url: str, payload: dict) -> bool:
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt, delay in enumerate(RETRY_DELAYS[:MAX_RETRIES]):
            try:
                response = await client.post(url, json=payload)
                if response.status_code in (200, 201, 409):
                    return True
                logger.warning(
                    "[red-team notify] Attempt %d: HTTP %d, retrying in %ds",
                    attempt + 1, response.status_code, delay,
                )
            except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as e:
                logger.warning(
                    "[red-team notify] Attempt %d: %s, retrying in %ds",
                    attempt + 1, e, delay,
                )
            await asyncio.sleep(delay)
    logger.error("[red-team notify] All %d attempts exhausted.", MAX_RETRIES)
    return False


def invoke(state):
    callback_url = state.get("callback_url")
    if not callback_url:
        state["agent_trace"].append({
            "node": "notify",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": "No callback_url — skipping notification.",
            "status": "done",
        })
        return state

    analyses = state.get("vulnerability_analysis", [])
    vulnerable_count = sum(
        1 for a in analyses
        for r in a.get("results", [])
        if r.get("vulnerable")
    )
    attack_count = sum(len(a.get("results", [])) for a in analyses)

    # Count critical findings (severity >= 4)
    critical_count = sum(
        1 for a in analyses
        for r in a.get("results", [])
        if r.get("severity", 1) >= 4
    )

    # Build findings list matching the Zod schema in Next.js
    findings = []
    for a in analyses:
        category = a.get("category", "unknown")
        for r in a.get("results", []):
            if r.get("vulnerable"):
                findings.append({
                    "attack_type": category,
                    "severity": {5: "CRITICAL", 4: "HIGH", 3: "MEDIUM"}.get(
                        r.get("severity", 1), "LOW"
                    ),
                    "description": r.get("reason", "No details."),
                })

    payload = {
        "red_team_run_id": state.get("red_team_run_id", ""),
        "findings": findings,
        "critical_count": critical_count,
        "attacks_generated": attack_count,
        "attacks_succeeded": vulnerable_count,
        "report_summary": state.get("report_summary", ""),
        "agent_trace": state.get("agent_trace", []),
    }

    success = asyncio.run(_post_with_retry(callback_url, payload))

    state["agent_trace"].append({
        "node": "notify",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": (
            f"Callback {'delivered' if success else 'FAILED'}. "
            f"Findings: {len(findings)}. Critical: {critical_count}."
        ),
        "status": "done" if success else "error",
    })
    return state
