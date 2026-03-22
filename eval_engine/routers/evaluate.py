from fastapi import APIRouter
from metrics.deepeval_runner import run_deepeval
from schemas.evaluate_schema import EvaluateRequest, EvaluateResponse

router = APIRouter()


@router.post("/evaluate")
async def evaluate(request: EvaluateRequest) -> EvaluateResponse:
    test_cases = [tc.model_dump() for tc in request.test_cases]
    results = run_deepeval(test_cases)
    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    average_score = round(
        sum(r["overall_score"] for r in results) / total,
        4,
    ) if total else 0.0
    return {
        "results": results,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": total - passed,
            "average_score": average_score,
        },
    }
