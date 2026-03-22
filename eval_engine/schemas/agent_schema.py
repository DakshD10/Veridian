from pydantic import BaseModel
from typing import Optional


class TestCasePayload(BaseModel):
    id: str
    input: str
    expected_output: str
    context: Optional[str] = None


class EvalSuitePayload(BaseModel):
    id: str
    name: str
    test_cases: list[TestCasePayload]


class AgentRunRequest(BaseModel):
    agent_run_id: str
    deployment_id: str
    trigger_event: str
    new_model_id: str
    previous_score: float
    threshold: float
    callback_url: str
    slack_webhook_url: Optional[str] = None
    eval_suite: EvalSuitePayload