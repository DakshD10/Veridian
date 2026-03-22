from typing import Optional

from pydantic import BaseModel


class TestCaseInput(BaseModel):
    id: str
    input: str
    expected_output: str
    actual_output: str
    context: Optional[str] = None


class EvaluateRequest(BaseModel):
    test_cases: list[TestCaseInput]
    metrics: list[str]


class EvaluateResponse(BaseModel):
    results: list[dict]
    summary: dict
