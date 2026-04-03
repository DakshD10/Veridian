from typing import Literal, Optional

from pydantic import BaseModel


class TestCaseInput(BaseModel):
    id: str
    input: str
    expected_output: str
    actual_output: str
    context: Optional[str] = None
    consistency_outputs: Optional[list[str]] = None
    boundary_output: Optional[str] = None


class EvaluateRequest(BaseModel):
    test_cases: list[TestCaseInput]
    metrics: list[str]
    eval_mode: Literal["standard", "rigorous", "brutal"] = "standard"


class EvaluateResponse(BaseModel):
    results: list[dict]
    summary: dict
