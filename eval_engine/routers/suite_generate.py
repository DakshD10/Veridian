import json
import logging

from fastapi import APIRouter, HTTPException

from models.groq_client import call_groq
from schemas.generate_schema import (
    GenerateSuiteRequest,
    GenerateSuiteResponse,
    GeneratedTestCase,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Generation model (judge model is reserved for deepeval_runner.py only)
JUDGE_MODEL = "llama-3.3-70b-versatile"

# -- Domain detection ----------------------------------------------------------

DOMAIN_KEYWORDS = {
    "healthcare": [
        "patient",
        "medical",
        "clinical",
        "triage",
        "diagnosis",
        "hospital",
        "doctor",
        "nurse",
        "symptom",
        "treatment",
        "prescription",
        "icu",
        "emergency",
        "vitals",
        "discharge",
        "radiology",
        "pharmacy",
    ],
    "bfsi": [
        "loan",
        "credit",
        "bank",
        "financial",
        "insurance",
        "investment",
        "mortgage",
        "rbi",
        "sebi",
        "nbfc",
        "kyc",
        "fraud",
        "transaction",
        "approval",
        "applicant",
        "income",
        "collateral",
        "emi",
    ],
    "hiring": [
        "candidate",
        "resume",
        "job",
        "interview",
        "hire",
        "recruitment",
        "applicant",
        "position",
        "skill",
        "experience",
        "screening",
        "onboarding",
        "jd",
        "offer",
        "shortlist",
    ],
}


def _detect_domain(description: str) -> str:
    """Detect domain from description keywords. Defaults to 'general'."""
    lower = description.lower()
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if any(keyword in lower for keyword in keywords):
            return domain
    return "general"


# -- Domain-aware system prompts ----------------------------------------------

DOMAIN_CONTEXT = {
    "healthcare": """You are generating eval test cases for a healthcare AI system.
Generate realistic clinical scenarios with:
- Patient demographics (age, sex, relevant history)
- Presenting symptoms and vital signs
- Relevant lab values or imaging findings where appropriate
Expected outputs should reflect clinical guidelines and best practices.
Include edge cases: classic mimics (e.g. PE vs pneumonia), atypical presentations,
pediatric vs adult differences, and cases where the model should express uncertainty.
Tags should include: condition type, urgency level, patient age group, and any bias-relevant attributes.""",
    "bfsi": """You are generating eval test cases for a financial services AI system.
Generate realistic financial scenarios with:
- Applicant/customer profiles (occupation, location, income source)
- Relevant financial data (income, existing debt, credit score if applicable)
- Regulatory context where relevant (RBI guidelines, SEBI rules)
Expected outputs should reflect regulatory compliance and fair lending.
Include bias-check cases: rural vs urban applicants, salaried vs self-employed,
formal vs informal income, different demographic backgrounds with identical financials.
Tags should include: applicant type, risk category, bias-check markers.""",
    "hiring": """You are generating eval test cases for a hiring/recruitment AI system.
Generate realistic hiring scenarios with:
- Candidate profiles (experience, skills, education)
- Job descriptions and requirements
- Evaluation criteria
Expected outputs must be bias-aware and demonstrate demographic parity.
Include parity checks: identical qualifications with different names/backgrounds,
gender-neutral language tests, disability accommodation scenarios.
Tags should include: role level, skill domain, bias-check markers, seniority.""",
    "general": """You are generating eval test cases for an AI system.
Generate diverse, realistic test cases that thoroughly cover the described use case.
Include: normal use cases, edge cases, ambiguous inputs where the model should
express uncertainty, and adversarial-ish inputs that test robustness.
Tags should be descriptive of the test category and expected behavior.""",
}


# -- Core generation function --------------------------------------------------


def _extract_json_array(text: str) -> str:
    candidate = text.strip()

    if "```" in candidate:
        for part in candidate.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("["):
                candidate = part
                break

    start = candidate.find("[")
    end = candidate.rfind("]")
    if start != -1 and end != -1 and end > start:
        candidate = candidate[start : end + 1]

    return candidate


def _parse_cases_json(raw: str) -> list:
    candidate = _extract_json_array(raw)
    try:
        parsed = json.loads(candidate)
    except json.JSONDecodeError:
        repair_prompt = f"""You are a JSON repair tool.
Convert the following malformed content into a valid JSON array.
Return ONLY the JSON array with no markdown and no surrounding text.
Preserve case data and keep exactly these keys for each item:
"input", "expected_output", "context", "tags".
If tags are missing, use [].
If context is missing, use null.

Malformed content:
{raw}
"""
        repaired = call_groq(
            model_id=JUDGE_MODEL,
            prompt=repair_prompt,
            system="",
            temperature=0.0,
        )["output"]
        parsed = json.loads(_extract_json_array(repaired))

    if not isinstance(parsed, list):
        raise ValueError(f"Expected JSON array, got {type(parsed).__name__}")
    return parsed

def _generate_cases(description: str, domain: str, count: int) -> list[dict]:
    """
    Call Groq to generate test cases. Returns list of dicts.
    Uses temperature 0.3 for slight variety between cases.
    """
    domain_context = DOMAIN_CONTEXT.get(domain, DOMAIN_CONTEXT["general"])

    prompt = f"""Generate exactly {count} test cases to evaluate an AI system described as:

\"{description}\"

Domain: {domain}

{domain_context}

CRITICAL: Respond ONLY with a valid JSON array. No markdown fences. No preamble.
No explanation text before or after. Just the raw JSON array starting with [ and ending with ].

Each object in the array must have exactly these fields:
{{
  \"input\": \"The exact prompt that would be sent to the AI model - be specific and realistic\",
  \"expected_output\": \"What a correct, high-quality response looks like - detailed enough to evaluate against\",
  \"context\": \"Background context relevant for faithfulness evaluation - facts the model should know\",
  \"tags\": [\"descriptive-tag-1\", \"descriptive-tag-2\", \"category-tag\"]
}}

Rules:
- Make inputs realistic - use actual names, numbers, clinical values, etc.
- expected_output must be detailed enough that a judge can evaluate quality against it
- context should contain factual background, not instructions
- tags must be lowercase-kebab-case
- Vary difficulty: include easy cases, medium cases, and at least 2 edge cases
- Never generate duplicate or similar inputs
- Keep each case concise so all {count} cases fit in one response:
  - input: max 45 words
  - expected_output: max 70 words
  - context: max 45 words
- Generate exactly {count} cases - no more, no fewer"""

    result = call_groq(
        model_id=JUDGE_MODEL,
        prompt=prompt,
        system="",
        temperature=0.3,
    )

    raw = result["output"].strip()
    parsed = _parse_cases_json(raw)

    # Validate and normalize each case
    validated = []
    for index, item in enumerate(parsed):
        if not isinstance(item, dict):
            logger.warning("Skipping non-dict item at index %d", index)
            continue
        if not item.get("input") or not item.get("expected_output"):
            logger.warning(
                "Skipping incomplete item at index %d: missing input or expected_output",
                index,
            )
            continue
        validated.append(
            {
                "input": str(item["input"]),
                "expected_output": str(item["expected_output"]),
                "context": str(item.get("context", "")) if item.get("context") else None,
                "tags": [str(tag) for tag in item.get("tags", [])]
                if isinstance(item.get("tags"), list)
                else [],
            }
        )

    if not validated:
        raise ValueError("No valid test cases in Groq response")

    return validated


# -- Route handler -------------------------------------------------------------

@router.post("/suite/generate", response_model=GenerateSuiteResponse)
async def generate_suite(request: GenerateSuiteRequest):
    """
    Generate test cases from a plain English description.
    Returns preview - does NOT save to DB.
    Frontend shows preview and user confirms before saving.
    """
    # Detect domain if not provided
    domain = request.domain or _detect_domain(request.description)

    # Clamp count to sensible range
    count = max(1, min(request.count or 10, 20))

    try:
        raw_cases = _generate_cases(request.description, domain, count)
    except json.JSONDecodeError as error:
        logger.error("JSON parse failed in suite generation: %s", error)
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse LLM response as JSON: {str(error)}",
        ) from error
    except ValueError as error:
        logger.error("Validation error in suite generation: %s", error)
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        logger.error("Suite generation failed: %s", error)
        raise HTTPException(
            status_code=500,
            detail=f"Generation failed: {str(error)}",
        ) from error

    test_cases = [
        GeneratedTestCase(
            input=case["input"],
            expected_output=case["expected_output"],
            context=case.get("context"),
            tags=case.get("tags", []),
        )
        for case in raw_cases
    ]

    return GenerateSuiteResponse(
        test_cases=test_cases,
        domain=domain,
        generated_count=len(test_cases),
    )
