from typing import List, Optional, TypedDict


class RedTeamState(TypedDict):
    # Inputs
    red_team_run_id: str
    suite_id: str
    target_model_id: str
    callback_url: str
    eval_suite: dict          # { id, name, domain, test_cases: [...] }

    # Built during execution
    test_cases: List[dict]    # capped at MAX_TEST_CASES = 6
    generated_attacks: dict   # { category: [attack_str × 6] }
    attack_results: dict      # { category: [{attack, response, test_case_id}] }
    vulnerability_analysis: List[dict]  # per-category analysis results
    overall_risk: str         # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    report_summary: str
    agent_trace: List[dict]
