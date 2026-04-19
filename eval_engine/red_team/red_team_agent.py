from langgraph.graph import END, START, StateGraph

from .nodes import (
    analyze_vulnerabilities,
    execute_attacks,
    generate_attacks,
    generate_red_team_report,
    load_targets,
    notify,
)
from .state import RedTeamState

# Build the graph
_graph = StateGraph(RedTeamState)

_graph.add_node("load_targets", load_targets.invoke)
_graph.add_node("generate_attacks", generate_attacks.invoke)
_graph.add_node("execute_attacks", execute_attacks.invoke)
_graph.add_node("analyze_vulnerabilities", analyze_vulnerabilities.invoke)
_graph.add_node("generate_red_team_report", generate_red_team_report.invoke)
_graph.add_node("notify", notify.invoke)

_graph.add_edge(START, "load_targets")
_graph.add_edge("load_targets", "generate_attacks")
_graph.add_edge("generate_attacks", "execute_attacks")
_graph.add_edge("execute_attacks", "analyze_vulnerabilities")
_graph.add_edge("analyze_vulnerabilities", "generate_red_team_report")
_graph.add_edge("generate_red_team_report", "notify")
_graph.add_edge("notify", END)

red_team_agent = _graph.compile()
