from langgraph.graph import StateGraph, START, END
from agent.nodes import (
    trigger_received,
    load_eval_suite,
    run_model,
    score_results,
    compare_baseline,
    generate_report,
    notify,
)
from agent.state import WatcherState

graph = StateGraph(WatcherState)

graph.add_node("trigger_received",  trigger_received.invoke)
graph.add_node("load_eval_suite",   load_eval_suite.invoke)
graph.add_node("run_model",         run_model.invoke)
graph.add_node("score_results",     score_results.invoke)
graph.add_node("compare_baseline",  compare_baseline.invoke)
graph.add_node("generate_report",   generate_report.invoke)
graph.add_node("notify",            notify.invoke)

graph.add_edge(START,              "trigger_received")
graph.add_edge("trigger_received", "load_eval_suite")
graph.add_edge("load_eval_suite",  "run_model")
graph.add_edge("run_model",        "score_results")
graph.add_edge("score_results",    "compare_baseline")
graph.add_edge("compare_baseline", "generate_report")
graph.add_edge("generate_report",  "notify")
graph.add_edge("notify",           END)

watcher = graph.compile()
