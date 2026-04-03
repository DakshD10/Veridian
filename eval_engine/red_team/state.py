from typing import List, Optional, TypedDict


class RedTeamState(TypedDict):
    # Inputs
    red_team_run_id: str
    suite_id: str
    model_id: str
    callback_url: str
    test_cases: List[dict]

    # Built during execution
    attack_inputs: List[dict]       # generated adversarial inputs
    attack_results: List[dict]      # model responses to attacks
    vulnerabilities: List[dict]     # confirmed vulnerabilities
    critical_count: int
    report_summary: str
    agent_trace: List[dict]
