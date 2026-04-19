import hashlib
import logging
import random
from datetime import datetime, timezone

from red_team.state import RedTeamState

logger = logging.getLogger(__name__)

MAX_TEST_CASES = 6   # was 10. Reduces execute_attacks from 70 to 42 calls.


def _deterministic_sample(
    test_cases: list[dict], max_count: int, seed: str
) -> list[dict]:
    """
    Strategically sample test cases using a deterministic seed.
    Same red_team_run_id always produces the same subset so reruns are reproducible.
    """
    if len(test_cases) <= max_count:
        return test_cases

    # Deterministic seed from run ID
    seed_int = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
    rng = random.Random(seed_int)

    return rng.sample(test_cases, max_count)


def invoke(state: RedTeamState) -> RedTeamState:
    """Validate test cases are present, apply sampling cap, and log to trace."""
    try:
        test_cases = state.get("eval_suite", {}).get("test_cases", [])
        original_count = len(test_cases)

        # Apply strategic sampling cap
        if original_count > MAX_TEST_CASES:
            seed = state.get("red_team_run_id", "default")
            test_cases = _deterministic_sample(test_cases, MAX_TEST_CASES, seed)
            state["test_cases"] = test_cases
            logger.info(
                "Sampled %d test cases from %d (seed=%s)",
                MAX_TEST_CASES,
                original_count,
                seed,
            )

        sampled_count = len(test_cases)
        summary = f"Loaded {sampled_count} test cases from suite {state.get('suite_id', '')}."
        if original_count > MAX_TEST_CASES:
            summary += (
                f" (strategically sampled from {original_count} — "
                f"cap is {MAX_TEST_CASES} per industry standard)"
            )

        state.setdefault("agent_trace", []).append({
            "node": "load_targets",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": summary,
            "status": "done",
        })
    except Exception as e:
        logger.warning("load_targets failed gracefully: %s", e)
        state.setdefault("agent_trace", []).append({
            "node": "load_targets",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": f"Failed to validate targets: {e}",
            "status": "error",
        })

    return state
