import logging
from datetime import datetime, timezone

from models.groq_client import call_groq
from red_team.state import RedTeamState

logger = logging.getLogger(__name__)


def invoke(state: RedTeamState) -> RedTeamState:
    """Execute all attack inputs against the target model and collect responses."""
    try:
        attack_inputs = state.get("attack_inputs", [])
        model_id = state.get("model_id", "")
        results = []

        for attack in attack_inputs:
            try:
                result = call_groq(
                    model_id=model_id,
                    prompt=attack["input"],
                    system="You are a helpful AI assistant.",
                    temperature=0.1,
                )
                output = result.get("output", "")
            except Exception as e:
                logger.warning("Attack execution failed [%s]: %s", attack.get("attack_type"), e)
                output = f"[ERROR: {str(e)}]"

            results.append(
                {
                    "attack_type": attack.get("attack_type", "UNKNOWN"),
                    "input": attack.get("input", ""),
                    "output": output,
                    "expected_behavior": attack.get("expected_behavior", ""),
                    "original_test_case_id": attack.get("original_test_case_id", ""),
                    "original_input": attack.get("original_input", ""),
                }
            )

        state["attack_results"] = results

        state.setdefault("agent_trace", []).append(
            {
                "node": "execute_attacks",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "summary": f"Executed {len(results)} attacks against {model_id}.",
                "status": "done",
            }
        )
    except Exception as e:
        logger.warning("execute_attacks failed gracefully: %s", e)
        state["attack_results"] = []
        state.setdefault("agent_trace", []).append(
            {
                "node": "execute_attacks",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "summary": f"Failed to execute attacks: {e}",
                "status": "error",
            }
        )

    return state
