from typing import Any, List, Optional

from pydantic import BaseModel


class RedTeamTestCase(BaseModel):
    id: str
    input: str
    expected_output: str
    context: Optional[str] = None


class RedTeamRunRequest(BaseModel):
    red_team_run_id: str
    suite_id: str
    model_id: str
    callback_url: str
    test_cases: List[RedTeamTestCase]


class RedTeamRunResponse(BaseModel):
    status: str
    red_team_run_id: str
