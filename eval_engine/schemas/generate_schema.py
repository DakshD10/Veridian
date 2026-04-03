from typing import List, Optional

from pydantic import BaseModel, Field


class GenerateSuiteRequest(BaseModel):
    description: str
    domain: Optional[str] = None  # "healthcare" | "bfsi" | "hiring" | "general"
    count: Optional[int] = 10


class GeneratedTestCase(BaseModel):
    input: str
    expected_output: str
    context: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class GenerateSuiteResponse(BaseModel):
    test_cases: List[GeneratedTestCase]
    domain: str
    generated_count: int
