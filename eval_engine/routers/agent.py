from fastapi import APIRouter
from fastapi.responses import JSONResponse
import threading
from schemas.agent_schema import AgentRunRequest

router = APIRouter()

def run_agent_background(payload: dict):
    try:
        from agent.watcher_agent import watcher
        initial_state = {
            "agent_run_id":     payload["agent_run_id"],
            "deployment_id":    payload["deployment_id"],
            "trigger_event":    payload["trigger_event"],
            "new_model_id":     payload["new_model_id"],
            "previous_score":   payload["previous_score"],
            "threshold":        payload["threshold"],
            "callback_url":     payload["callback_url"],
            "slack_webhook_url": payload.get("slack_webhook_url"),
            "eval_suite":       payload["eval_suite"],
            "test_results":     [],
            "scored_results":   [],
            "overall_score":    0.0,
            "regression_found": False,
            "decision":         "",
            "report_summary":   "",
            "agent_trace":      [],
        }
        watcher.invoke(initial_state)
    except Exception as e:
        print(f"[agent] Background run failed: {str(e)}")


@router.post("/agent/run")
async def agent_run(request: AgentRunRequest):
    payload = request.model_dump()
    thread = threading.Thread(
        target=run_agent_background,
        args=(payload,),
        daemon=True
    )
    thread.start()
    return JSONResponse(
        status_code=202,
        content={
            "status": "started",
            "agent_run_id": request.agent_run_id
        }
    )
