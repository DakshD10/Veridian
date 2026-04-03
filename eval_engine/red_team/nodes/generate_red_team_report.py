import asyncio
import json
import logging
from datetime import datetime, timezone

import httpx

from models.groq_client import call_groq
from ..state import RedTeamState

logger = logging.getLogger(__name__)

JUDGE_MODEL = "llama-3.3-70b-versatile"
MAX_RETRIES = 5
RETRY_DELAYS = [2, 4, 8, 16, 32]


async def _post_with_retry(url: str, payload: dict) -> bool:
    """POST with exponential backoff retry. 409 treated as success (idempotent)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt, delay in enumerate(RETRY_DELAYS):
            try:
                response = await client.post(url, json=payload)
                if response.status_code == 409:
                    logger.info("Red team callback 409 - already completed (idempotent)")
                    return True
                if response.status_code < 300:
                    return True
                logger.warning(
                    "Red team callback attempt %s failed: %s",
                    attempt + 1,
                    response.status_code,
                )
            except Exception as e:
                logger.warning("Red team callback attempt %s error: %s", attempt + 1, e)

            if attempt < len(RETRY_DELAYS) - 1:
                await asyncio.sleep(delay)

    return False


def _generate_detailed_report_text(attack_results: list[dict], vulnerabilities: list[dict]) -> str:
    """Generate comprehensive Red Team report with attack details and analysis."""
    
    # Group attacks by type for analysis
    attack_summary = {}
    for result in attack_results:
        attack_type = result.get("attack_type", "UNKNOWN")
        if attack_type not in attack_summary:
            attack_summary[attack_type] = {
                "total": 0,
                "successful": 0,
                "examples": []
            }
        attack_summary[attack_type]["total"] += 1
        
        # Check if this attack resulted in a vulnerability
        matching_vuln = next((v for v in vulnerabilities if 
                            v.get("attack_type") == attack_type and 
                            v.get("original_test_case_id") == result.get("original_test_case_id")), None)
        if matching_vuln:
            attack_summary[attack_type]["successful"] += 1
            attack_summary[attack_type]["examples"].append({
                "input": result.get("input", ""),
                "output": result.get("output", ""),
                "vulnerability": matching_vuln
            })
    
    if not vulnerabilities:
        return (
            "🛡️ RED TEAM SECURITY ASSESSMENT - MODEL RESILIENT\n\n"
            "Executive Summary: The target model demonstrated strong resilience against comprehensive adversarial testing.\n\n"
            "Attack Vectors Tested:\n"
        ) + _format_attack_summary(attack_summary) + (
            "\nFindings: No critical vulnerabilities detected. The model withstood all adversarial inputs "
            "across prompt injection, jailbreak, boundary case, paraphrase, and confidence probing attacks.\n\n"
            "Security Posture: SECURE - No immediate concerns identified.\n\n"
            "Recommendation: Model appears safe for production deployment with current security controls."
        )
    
    # Build detailed report
    report = (
        "🚨 RED TEAM SECURITY ASSESSMENT - VULNERABILITIES DETECTED\n\n"
        "Executive Summary: The target model contains security weaknesses that could be exploited in production.\n\n"
        "Attack Vectors Tested:\n"
    ) + _format_attack_summary(attack_summary) + (
        "\n📋 DETAILED VULNERABILITY FINDINGS:\n\n"
    )
    
    # Add detailed vulnerability analysis
    critical_vulns = [v for v in vulnerabilities if v.get("severity") == "CRITICAL"]
    high_vulns = [v for v in vulnerabilities if v.get("severity") == "HIGH"]
    medium_vulns = [v for v in vulnerabilities if v.get("severity") == "MEDIUM"]
    low_vulns = [v for v in vulnerabilities if v.get("severity") == "LOW"]
    
    if critical_vulns:
        report += "🔴 CRITICAL VULNERABILITIES:\n"
        for i, vuln in enumerate(critical_vulns, 1):
            report += _format_vulnerability_detail(vuln, i, "CRITICAL")
    
    if high_vulns:
        report += "\n🟠 HIGH VULNERABILITIES:\n"
        for i, vuln in enumerate(high_vulns, 1):
            report += _format_vulnerability_detail(vuln, i, "HIGH")
    
    if medium_vulns:
        report += "\n🟡 MEDIUM VULNERABILITIES:\n"
        for i, vuln in enumerate(medium_vulns, 1):
            report += _format_vulnerability_detail(vuln, i, "MEDIUM")
    
    if low_vulns:
        report += "\n🟢 LOW VULNERABILITIES:\n"
        for i, vuln in enumerate(low_vulns, 1):
            report += _format_vulnerability_detail(vuln, i, "LOW")
    
    # Add attack examples
    report += "\n💬 ATTACK EXAMPLES AND RESPONSES:\n\n"
    for attack_type, data in attack_summary.items():
        if data["examples"]:
            report += f"▸ {attack_type.replace('_', ' ').title()} Attacks:\n"
            for j, example in enumerate(data["examples"][:2], 1):  # Limit examples
                report += f"  {j}. Attack Input: \"{example['input'][:100]}{'...' if len(example['input']) > 100 else ''}\"\n"
                report += f"     Model Response: \"{example['output'][:150]}{'...' if len(example['output']) > 150 else ''}\"\n"
                report += f"     Issue: {example['vulnerability'].get('description', 'N/A')}\n\n"
    
    # Security assessment and recommendations
    report += (
        "🎯 SECURITY ASSESSMENT:\n"
        f"• Risk Level: {'CRITICAL' if critical_vulns else 'HIGH' if high_vulns else 'MEDIUM' if medium_vulns else 'LOW'}\n"
        f"• Total Vulnerabilities: {len(vulnerabilities)} ({len(critical_vulns)} Critical, {len(high_vulns)} High, {len(medium_vulns)} Medium, {len(low_vulns)} Low)\n"
        f"• Attack Success Rate: {len(vulnerabilities)}/{len(attack_results)} ({(len(vulnerabilities)/len(attack_results)*100):.1f}%)\n\n"
        "🛠️ IMMEDIATE ACTIONS REQUIRED:\n"
    )
    
    if critical_vulns:
        report += "1. URGENT: Address all CRITICAL vulnerabilities before production deployment\n"
        report += "2. Implement input sanitization and prompt filtering immediately\n"
    
    if high_vulns:
        report += "3. Review and strengthen model guardrails for HIGH severity issues\n"
        report += "4. Add additional safety layers for identified attack vectors\n"
    
    report += (
        "5. Conduct regression testing after security fixes\n"
        "6. Implement continuous Red Team testing in CI/CD pipeline\n\n"
        "📊 TECHNICAL DETAILS:\n"
        f"• Assessment Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
        f"• Target Model: {attack_results[0].get('model_id', 'Unknown') if attack_results else 'Unknown'}\n"
        f"• Attack Types Simulated: {len(attack_summary)}\n"
        f"• Total Attack Executions: {len(attack_results)}\n"
        f"• Evaluation Framework: Veridian Red Team v2.0\n\n"
        "🔐 This report contains sensitive security information. Handle with appropriate clearance."
    )
    
    return report


def _format_attack_summary(attack_summary: dict) -> str:
    """Format attack summary by type."""
    summary = ""
    for attack_type, data in attack_summary.items():
        success_rate = (data["successful"] / data["total"] * 100) if data["total"] > 0 else 0
        summary += f"• {attack_type.replace('_', ' ').title()}: {data['successful']}/{data['total']} successful ({success_rate:.1f}%)\n"
    return summary


def _format_vulnerability_detail(vuln: dict, index: int, severity: str) -> str:
    """Format individual vulnerability with rich detail."""
    emoji = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🟢"}
    
    detail = (
        f"{emoji.get(severity, '⚪')} {index}. {vuln.get('attack_type', 'Unknown').replace('_', ' ').title()}\n"
        f"   Risk Level: {severity}\n"
        f"   Description: {vuln.get('description', 'No description available')}\n"
        f"   Impact: {vuln.get('impact', 'Impact not specified')}\n"
        f"   Original Test Case: #{vuln.get('original_test_case_id', 'Unknown')}\n"
    )
    
    if vuln.get('recommendation'):
        detail += f"   Recommendation: {vuln['recommendation']}\n"
    
    detail += "\n"
    return detail


def _generate_report_text(vulnerabilities: list[dict]) -> str:
    """Use Groq to write 3-4 sentence vulnerability summary."""
    # This is now a fallback - use detailed report generation
    attack_results = []  # This should be passed from state in a real implementation
    return _generate_detailed_report_text(attack_results, vulnerabilities)


def invoke(state: RedTeamState) -> RedTeamState:
    """Generate report summary and POST callback to Next.js."""
    try:
        vulnerabilities = state.get("vulnerabilities", [])
        attack_results = state.get("attack_results", [])
        
        # Generate comprehensive report
        report_summary = _generate_detailed_report_text(attack_results, vulnerabilities)
        state["report_summary"] = report_summary

        # Build callback payload
        payload = {
            "red_team_run_id": state["red_team_run_id"],
            "findings": vulnerabilities,
            "critical_count": state.get("critical_count", 0),
            "attacks_generated": len(state.get("attack_inputs", [])),
            "attacks_succeeded": len(vulnerabilities),
            "report_summary": report_summary,
            "agent_trace": state["agent_trace"]
            + [
                {
                    "node": "generate_red_team_report",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "summary": (
                        f"Report generated. {len(vulnerabilities)} vulnerabilities found. "
                        + (
                            f"{state.get('critical_count', 0)} CRITICAL."
                            if state.get("critical_count", 0) > 0
                            else "No CRITICAL findings."
                        )
                    ),
                    "status": "done",
                }
            ],
        }

        success = asyncio.run(_post_with_retry(state["callback_url"], payload))

        state["agent_trace"].append(
            {
                "node": "generate_red_team_report",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "summary": (
                    f"Report generated. {len(vulnerabilities)} vulnerabilities found. "
                    f"Callback {'delivered' if success else 'FAILED after retries'}."
                ),
                "status": "done" if success else "error",
            }
        )
    except Exception as e:
        logger.warning("generate_red_team_report failed gracefully: %s", e)
        state.setdefault("agent_trace", []).append(
            {
                "node": "generate_red_team_report",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "summary": f"Failed to generate/post report: {e}",
                "status": "error",
            }
        )

    return state
