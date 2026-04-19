import logging
import threading

from fastapi import APIRouter

from red_team.red_team_agent import red_team_agent
from schemas.red_team_schema import RedTeamRunRequest, RedTeamRunResponse

logger = logging.getLogger(__name__)

router = APIRouter()


def _run_agent(initial_state: dict) -> None:
    """Run red team agent in background thread. Errors are logged, never raised."""
    try:
        red_team_agent.invoke(initial_state)
    except Exception as e:
        logger.error(
            "Red team agent crashed for run %s: %s",
            initial_state.get("red_team_run_id"),
            e,
            exc_info=True,
        )


@router.post("/red-team/run", response_model=RedTeamRunResponse, status_code=202)
async def run_red_team(request: RedTeamRunRequest):
    """
    Start a red team agent run in a background thread.
    Returns 202 immediately.
    Agent POSTs results to callback_url when complete.
    """
    initial_state: dict = {
        "red_team_run_id": request.red_team_run_id,
        "suite_id": request.suite_id,
        "target_model_id": request.model_id,
        "callback_url": request.callback_url,
        "eval_suite": {
            "id": request.suite_id,
            "domain": "general",
            "test_cases": [
                {
                    "id": tc.id,
                    "input": tc.input,
                    "expected_output": tc.expected_output,
                    "context": tc.context,
                }
                for tc in request.test_cases
            ],
        },
        "test_cases": [],
        "generated_attacks": {},
        "attack_results": {},
        "vulnerability_analysis": [],
        "overall_risk": "",
        "report_summary": "",
        "agent_trace": [],
    }

    thread = threading.Thread(
        target=_run_agent,
        args=(initial_state,),
        daemon=True,
        name=f"red-team-{request.red_team_run_id}",
    )
    thread.start()

    logger.info(
        "Red team agent started for run %s (suite=%s, model=%s)",
        request.red_team_run_id,
        request.suite_id,
        request.model_id,
    )

    return RedTeamRunResponse(
        status="started",
        red_team_run_id=request.red_team_run_id,
    )
