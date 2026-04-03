# eval_engine/agent/state.py
from typing import TypedDict, Optional, List

class WatcherState(TypedDict):
    # --- Inputs (set before graph starts) ---
    agent_run_id: str
    deployment_id: str
    trigger_event: str
    trigger_source: str
    new_model_id: str
    previous_score: float
    threshold: float
    callback_url: str
    slack_webhook_url: Optional[str]
    slack_channel_id: Optional[str]
    telegram_chat_id: Optional[str]
    eval_suite: dict             # { id, name, test_cases: [...] }

    # --- Built during execution ---
    test_results: List[dict]     # [{ id, actual_output, latency_ms }]
    scored_results: List[dict]   # [{ id, passed, scores, reasons, overall_score }]
    overall_score: float
    regression_found: bool
    decision: str                # "PASS" | "FAIL" | "ERROR"
    report_summary: str          # LLM-generated narrative
    agent_trace: List[dict]      # [{ node, timestamp, summary, status }]

    # NEW — added for root cause analysis node
    root_cause: str
    failure_clusters: List[str]
