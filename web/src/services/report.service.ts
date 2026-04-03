import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { createElement } from "react";
import { prisma } from "@/lib/prisma";

type RedTeamFinding = {
  attack_type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  input?: string;
  output?: string;
  original_test_case_id?: string;
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#FAFBFF",
    color: "#1A202C",
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "2px solid #E2E8F0",
  },
  title: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
    marginBottom: 12,
    padding: "12px 16px",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderLeft: "4px solid #3B82F6",
  },
  statRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Helvetica",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0F172A",
  },
  testCaseBox: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  testCaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  testCaseInput: {
    fontSize: 10,
    color: "#1A202C",
    marginBottom: 8,
    flex: 1,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  passedBadge: {
    fontSize: 10,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#10B981",
    padding: "4px 8px",
    borderRadius: 6,
  },
  failedBadge: {
    fontSize: 10,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#EF4444",
    padding: "4px 8px",
    borderRadius: 6,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottom: "1px solid #F1F5F9",
  },
  metricName: {
    fontSize: 9,
    color: "#64748B",
    width: 100,
    textTransform: "capitalize",
    fontFamily: "Helvetica",
  },
  metricScore: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    width: 40,
    textAlign: "right",
  },
  metricReason: {
    fontSize: 8,
    color: "#64748B",
    flex: 1,
    paddingLeft: 12,
    fontStyle: "italic",
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#A1A1AA",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function scoreColor(score: number): string {
  if (score >= 0.7) return "#10B981";
  if (score >= 0.5) return "#F59E0B";
  return "#EF4444";
}

// Red Team specific styles
const redTeamStyles = StyleSheet.create({
  criticalBadge: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  highBadge: {
    backgroundColor: "#FEF3C7",
    color: "#D97706",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  mediumBadge: {
    backgroundColor: "#FEF9E7",
    color: "#D97706",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  lowBadge: {
    backgroundColor: "#F0FDF4",
    color: "#059669",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  attackExample: {
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  attackInput: {
    fontSize: 9,
    color: "#64748B",
    marginBottom: 6,
    fontFamily: "Courier",
    backgroundColor: "#F1F5F9",
    padding: 8,
    borderRadius: 4,
  },
  attackOutput: {
    fontSize: 9,
    color: "#1A202C",
    fontFamily: "Courier",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderRadius: 4,
    border: "1px solid #E2E8F0",
  },
  summaryBox: {
    backgroundColor: "#EFF6FF",
    border: "1px solid #3B82F6",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1E40AF",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
    fontFamily: "Helvetica",
  },
});

export async function generateRedTeamReport(
  redTeamRunId: string
): Promise<Buffer> {

  const redTeamRun = await prisma.redTeamRun.findUnique({
    where: { id: redTeamRunId },
    include: {
      suite: {
        select: {
          id: true,
          name: true,
          domain: true,
        },
      },
    },
  });

  if (!redTeamRun) {
    throw new Error(`RedTeamRun not found: ${redTeamRunId}`);
  }

  const generatedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "long",
    timeStyle: "short",
  });

  const findings = (Array.isArray(redTeamRun.findings) ? redTeamRun.findings : []) as RedTeamFinding[];

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.title }, "🛡️ Veridian Red Team Security Report"),
        createElement(
          Text,
          { style: styles.subtitle },
          `Suite: ${redTeamRun.suite?.name || "Unknown Suite"}  ·  Model: ${redTeamRun.modelId}  ·  Generated: ${generatedAt}`
        )
      ),
      
      // Executive Summary
      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "🚨 Executive Summary"),
        createElement(
          View,
          { style: redTeamStyles.summaryBox },
          createElement(Text, { style: redTeamStyles.summaryTitle }, "Security Assessment"),
          createElement(
            Text,
            { style: redTeamStyles.summaryText },
            redTeamRun.reportSummary || "No security assessment available."
          )
        )
      ),
      
      // Attack Statistics
      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "📊 Attack Statistics"),
        createElement(
          View,
          { style: styles.statRow },
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "Total Attacks"),
            createElement(Text, { style: styles.statValue }, String(redTeamRun.attacksGenerated))
          ),
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "Successful"),
            createElement(Text, { style: { ...styles.statValue, color: "#DC2626" } }, String(redTeamRun.attacksSucceeded))
          ),
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "Success Rate"),
            createElement(
              Text,
              {
                style: {
                  ...styles.statValue,
                  color: redTeamRun.attacksSucceeded > 0 ? "#DC2626" : "#10B981",
                },
              },
              `${redTeamRun.attacksGenerated > 0 ? ((redTeamRun.attacksSucceeded / redTeamRun.attacksGenerated) * 100).toFixed(1) : "0.0"}%`
            )
          ),
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "Critical Findings"),
            createElement(Text, { style: { ...styles.statValue, color: redTeamRun.criticalFindings > 0 ? "#DC2626" : "#10B981" } }, String(redTeamRun.criticalFindings))
          )
        )
      ),

      // Detailed Findings
      ...(findings.length > 0
        ? findings.map((finding, index: number) =>
            createElement(
              View,
              { key: `${finding.attack_type}-${index}`, style: styles.testCaseBox },
              createElement(
                View,
                { style: styles.testCaseHeader },
                createElement(
                  Text,
                  {
                    style: {
                      ...styles.testCaseInput,
                      fontFamily: "Helvetica-Bold",
                      marginBottom: 0,
                      fontSize: 11,
                    },
                  },
                  `${index + 1}. ${finding.attack_type?.replace(/_/g, " ")?.toUpperCase()}`
                ),
                createElement(
                  Text,
                  { 
                    style: redTeamStyles[finding.severity.toLowerCase() + "Badge" as keyof typeof redTeamStyles] || redTeamStyles.lowBadge 
                  },
                  finding.severity
                )
              ),
              
              // Attack Input/Output Example
              finding.input && finding.output ? createElement(
                View,
                { style: { marginTop: 12 } },
                createElement(Text, { style: { ...styles.testCaseInput, fontSize: 9, marginBottom: 6 } }, "Attack Example:"),
                createElement(
                  View,
                  { style: redTeamStyles.attackExample },
                  createElement(Text, { style: redTeamStyles.attackInput }, `Input: ${finding.input}`),
                  createElement(Text, { style: { ...redTeamStyles.attackOutput, marginTop: 6 } }, `Output: ${finding.output}`)
                )
              ) : null,
              
              // Description
              createElement(
                Text,
                {
                  style: {
                    ...styles.testCaseInput,
                    marginTop: finding.input ? 12 : 0,
                  },
                },
                finding.description || "No description available."
              )
            )
          )
        : [
            createElement(
              View,
              { style: styles.testCaseBox },
              createElement(Text, { style: styles.testCaseInput }, "🎉 No vulnerabilities detected! The model successfully resisted all attack vectors.")
            )
          ]),
      
      // Footer
      createElement(
        View,
        { style: styles.footer },
        createElement(Text, {}, "Veridian AI Quality Infrastructure · DPDP Audit Ready"),
        createElement(Text, {}, `Run ID: ${redTeamRunId}`)
      )
    )
  );

  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}

export async function generateComplianceReport(
  runId: string
): Promise<Buffer> {

  const run = await prisma.evalRun.findUnique({
    where: { id: runId },
    include: {
      suite: true,
      agentRun: {
        select: {
          id: true,
          rootCause: true,
          regressionFound: true,
          decision: true,
        },
      },
      results: {
        include: {
          testCase: true,
          metricScores: {
            orderBy: { metricName: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!run) {
    console.log("Run not found:", runId);
    throw new Error(`EvalRun not found: ${runId}`);
  }

  const latestRedTeamRun = await prisma.redTeamRun.findFirst({
    where: {
      suiteId: run.suiteId,
      status: "completed",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      attacksGenerated: true,
      attacksSucceeded: true,
      criticalFindings: true,
      reportSummary: true,
      findings: true,
    },
  });

  const severityCounts = run.results.reduce(
    (acc, result) => {
      const severity = (result as { severity?: string | null }).severity ?? "LOW";
      if (severity === "CRITICAL") acc.CRITICAL += 1;
      else if (severity === "HIGH") acc.HIGH += 1;
      else if (severity === "MEDIUM") acc.MEDIUM += 1;
      else acc.LOW += 1;
      return acc;
    },
    { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  );

  type ComplianceMetric = {
    metricName: string;
    score: number;
    reason: string | null;
  };
  type ComplianceResult = {
    id: string;
    passed: boolean;
    testCase: { input: string };
    metricScores: ComplianceMetric[];
  };
  const runResults = run.results as ComplianceResult[];

  const generatedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "long",
    timeStyle: "short",
  });

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(
        View,
        { style: styles.header },
        createElement(Text, { style: styles.title }, "📋 Veridian Compliance Report"),
        createElement(
          Text,
          { style: styles.subtitle },
          `Suite: ${run.suite.name}  ·  Model: ${run.modelId}  ·  Generated: ${generatedAt}`
        )
      ),
      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "Run Summary"),
        createElement(
          View,
          { style: styles.statRow },
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "Overall Score"),
            createElement(
              Text,
              {
                style: {
                  ...styles.statValue,
                  color: scoreColor(run.overallScore ?? 0),
                },
              },
              run.overallScore != null
                ? `${(run.overallScore * 100).toFixed(1)}%`
                : "N/A"
            )
          ),
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "Passed"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: "#10B981" } },
              String(run.passedCount)
            )
          ),
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "Failed"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: "#EF4444" } },
              String(run.failedCount)
            )
          ),
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "Status"),
            createElement(Text, { style: styles.statValue }, run.status)
          )
        )
      ),
      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "Severity Breakdown"),
        createElement(
          View,
          { style: styles.statRow },
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "CRITICAL"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: "#DC2626" } },
              String(severityCounts.CRITICAL)
            )
          ),
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "HIGH"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: "#F97316" } },
              String(severityCounts.HIGH)
            )
          ),
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "MEDIUM"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: "#F59E0B" } },
              String(severityCounts.MEDIUM)
            )
          ),
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "LOW"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: "#10B981" } },
              String(severityCounts.LOW)
            )
          )
        )
      ),
      run.agentRun?.rootCause
        ? createElement(
            View,
            { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, "Root Cause Analysis"),
            createElement(
              View,
              { style: styles.testCaseBox },
              createElement(
                Text,
                { style: styles.testCaseInput },
                run.agentRun.rootCause
              )
            )
          )
        : null,
      latestRedTeamRun
        ? createElement(
            View,
            { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, "Red Team Findings"),
            createElement(
              View,
              { style: styles.testCaseBox },
              createElement(
                Text,
                { style: styles.testCaseInput },
                latestRedTeamRun.reportSummary ||
                  `Attacks generated: ${latestRedTeamRun.attacksGenerated}, succeeded: ${latestRedTeamRun.attacksSucceeded}, critical findings: ${latestRedTeamRun.criticalFindings}.`
              )
            )
          )
        : null,
      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, `Test Case Results (${runResults.length} cases)`),
        ...runResults.map((result, index: number) =>
          createElement(
            View,
            { key: result.id, style: styles.testCaseBox },
            createElement(
              View,
              { style: styles.testCaseHeader },
              createElement(
                Text,
                { style: styles.testCaseInput },
                `${index + 1}. ${result.testCase.input.slice(0, 120)}${
                  result.testCase.input.length > 120 ? "..." : ""
                }`
              ),
              createElement(
                Text,
                  {
                    style: result.passed
                      ? styles.passedBadge
                      : styles.failedBadge,
                  },
                  result.passed ? "PASS" : "FAIL"
              )
            ),
            createElement(
              View,
              { style: { marginTop: 12 } },
              ...result.metricScores.map((metric, metricIndex: number) =>
                createElement(
                  View,
                  { key: `${result.id}-${metricIndex}`, style: styles.metricRow },
                  createElement(
                    Text,
                    { style: styles.metricName },
                    metric.metricName.replace(/_/g, " ")
                  ),
                  createElement(
                    Text,
                    { style: { ...styles.metricScore, color: scoreColor(metric.score) } },
                    `${(metric.score * 100).toFixed(0)}%`
                  ),
                  createElement(
                    Text,
                    { style: styles.metricReason },
                    metric.reason || ""
                  )
                )
              )
            )
          )
        )
      ),
      
      // Footer
      createElement(
        View,
        { style: styles.footer },
        createElement(Text, {}, "Veridian AI Quality Infrastructure · DPDP Audit Ready"),
        createElement(Text, {}, `Run ID: ${run.id}`)
      )
    )
  );

  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}
