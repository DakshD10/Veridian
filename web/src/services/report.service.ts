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

const MAX_SUMMARY_CHARS = 6000;
const MAX_FINDING_DESCRIPTION_CHARS = 500;
const MAX_FINDING_IO_CHARS = 700;
const MAX_ATTACK_TYPE_CHARS = 120;
const MAX_RENDERED_FINDINGS = 24;

function normalizeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function sanitizeForPdf(value: unknown, maxChars = 2000): string {
  const normalized = normalizeText(value)
    .normalize("NFKD")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[\u2028\u2029]/g, "\n")
    .replace(/\u202F/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  // Prevent pathological unbroken tokens from destabilizing text layout.
  const withBreaks = normalized.replace(/(\S{120})(?=\S)/g, "$1 ");
  if (withBreaks.length <= maxChars) return withBreaks;
  return `${withBreaks.slice(0, maxChars).trimEnd()}... [truncated]`;
}

function normalizeSeverity(value: unknown): RedTeamFinding["severity"] {
  const severity = normalizeText(value).toUpperCase();
  if (severity === "CRITICAL") return "CRITICAL";
  if (severity === "HIGH") return "HIGH";
  if (severity === "MEDIUM") return "MEDIUM";
  return "LOW";
}

function normalizeFinding(raw: unknown, index: number): RedTeamFinding {
  const source = (typeof raw === "object" && raw !== null
    ? (raw as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const attackType = sanitizeForPdf(
    source.attack_type ?? source.attackType,
    MAX_ATTACK_TYPE_CHARS
  );
  const description = sanitizeForPdf(
    source.description,
    MAX_FINDING_DESCRIPTION_CHARS
  );
  const input = sanitizeForPdf(source.input, MAX_FINDING_IO_CHARS);
  const output = sanitizeForPdf(source.output, MAX_FINDING_IO_CHARS);
  const originalTestCaseId = sanitizeForPdf(
    source.original_test_case_id ?? source.originalTestCaseId,
    120
  );

  return {
    attack_type: attackType || `unspecified_attack_${index + 1}`,
    severity: normalizeSeverity(source.severity),
    description,
    input: input || undefined,
    output: output || undefined,
    original_test_case_id: originalTestCaseId || undefined,
  };
}

const palette = {
  pageBg: "#F8FAFC",
  cardBg: "#FFFFFF",
  border: "#D9E2EC",
  borderSoft: "#E8EDF3",
  text: "#0F172A",
  textMuted: "#475569",
  title: "#0B1324",
  pass: "#15803D",
  fail: "#B91C1C",
  critical: "#B91C1C",
  high: "#C2410C",
  medium: "#A16207",
  low: "#166534",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: palette.text,
    backgroundColor: palette.pageBg,
    paddingTop: 34,
    paddingBottom: 52,
    paddingHorizontal: 34,
    lineHeight: 1.4,
  },
  headerCard: {
    backgroundColor: palette.cardBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: palette.title,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: palette.textMuted,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
    paddingTop: 8,
  },
  metaItem: {
    width: "50%",
    marginBottom: 4,
    paddingRight: 8,
  },
  metaLabel: {
    fontSize: 8,
    color: "#64748B",
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 9,
    color: palette.text,
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: palette.cardBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  summaryText: {
    fontSize: 9,
    color: palette.text,
    lineHeight: 1.45,
  },
  mutedText: {
    fontSize: 8.5,
    color: palette.textMuted,
    lineHeight: 1.45,
  },
  statsRow: {
    flexDirection: "row",
    marginLeft: -4,
    marginRight: -4,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 0,
    marginLeft: 4,
    marginRight: 4,
    backgroundColor: palette.cardBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingTop: 9,
    paddingBottom: 9,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 8,
    color: "#64748B",
    marginBottom: 3,
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: palette.text,
  },
  resultCard: {
    backgroundColor: palette.cardBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: palette.text,
    flexGrow: 1,
    paddingRight: 8,
  },
  promptLabel: {
    fontSize: 8,
    color: "#64748B",
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  promptText: {
    fontSize: 9,
    color: palette.text,
    lineHeight: 1.4,
  },
  statusPass: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: palette.pass,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 7,
  },
  statusFail: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: palette.fail,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 7,
  },
  metricItem: {
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
    paddingTop: 6,
    marginTop: 6,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    textTransform: "capitalize",
    paddingRight: 8,
  },
  metricScore: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  metricReason: {
    marginTop: 2,
    fontSize: 8,
    color: palette.textMuted,
    lineHeight: 1.35,
  },
  findingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  findingTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: palette.text,
    flexGrow: 1,
    paddingRight: 8,
  },
  severityCritical: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: palette.critical,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 6,
  },
  severityHigh: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: palette.high,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 6,
  },
  severityMedium: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: palette.medium,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 6,
  },
  severityLow: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: palette.low,
    borderRadius: 4,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 6,
  },
  codeBlock: {
    borderWidth: 1,
    borderColor: palette.borderSoft,
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
    paddingTop: 7,
    paddingBottom: 7,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  codeLabel: {
    fontSize: 8,
    color: "#64748B",
    marginBottom: 2,
    letterSpacing: 0.4,
  },
  codeText: {
    fontFamily: "Courier",
    fontSize: 8,
    color: "#1E293B",
    lineHeight: 1.35,
  },
  footer: {
    position: "absolute",
    left: 34,
    right: 34,
    bottom: 18,
    borderTopWidth: 1,
    borderTopColor: palette.borderSoft,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 8,
    color: "#64748B",
  },
  footerPageNumber: {
    fontSize: 8,
    color: "#64748B",
  },
});

function scoreColor(score: number): string {
  if (score >= 0.7) return palette.pass;
  if (score >= 0.5) return "#B45309";
  return palette.fail;
}

function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null) return "N/A";
  return `${(value * 100).toFixed(digits)}%`;
}

function cleanReportText(text: unknown, maxChars = MAX_SUMMARY_CHARS): string {
  const normalized = sanitizeForPdf(text, maxChars);
  if (!normalized) return "";
  return normalized
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateText(text: string, maxChars = 220): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}...`;
}

function getSeverityStyle(severity: RedTeamFinding["severity"]) {
  if (severity === "CRITICAL") return styles.severityCritical;
  if (severity === "HIGH") return styles.severityHigh;
  if (severity === "MEDIUM") return styles.severityMedium;
  return styles.severityLow;
}

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

  const findings = Array.isArray(redTeamRun.findings)
    ? redTeamRun.findings.map((finding, index) => normalizeFinding(finding, index))
    : [];
  const findingsToRender = findings.slice(0, MAX_RENDERED_FINDINGS);
  const omittedFindings = findings.length - findingsToRender.length;

  const successRate =
    redTeamRun.attacksGenerated > 0
      ? redTeamRun.attacksSucceeded / redTeamRun.attacksGenerated
      : 0;

  const summaryText =
    cleanReportText(redTeamRun.reportSummary) ||
    "No formal security summary was generated for this run.";

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(
        View,
        { style: styles.headerCard },
        createElement(Text, { style: styles.title }, "Veridian Red Team Security Report"),
        createElement(
          Text,
          { style: styles.subtitle },
          "Security posture report for adversarial prompt resilience"
        ),
        createElement(
          View,
          { style: styles.metaRow },
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, "RUN ID"),
            createElement(Text, { style: styles.metaValue }, redTeamRun.id)
          ),
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, "GENERATED"),
            createElement(Text, { style: styles.metaValue }, generatedAt)
          ),
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, "SUITE"),
            createElement(
              Text,
              { style: styles.metaValue },
              redTeamRun.suite?.name || "Unknown Suite"
            )
          ),
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, "MODEL"),
            createElement(Text, { style: styles.metaValue }, redTeamRun.modelId)
          )
        )
      ),

      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "EXECUTIVE SUMMARY"),
        createElement(
          View,
          { style: styles.card },
          createElement(Text, { style: styles.summaryText }, summaryText)
        )
      ),

      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "ATTACK STATISTICS"),
        createElement(
          View,
          { style: styles.statsRow },
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "TOTAL ATTACKS"),
            createElement(Text, { style: styles.statValue }, String(redTeamRun.attacksGenerated))
          ),
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "SUCCESSFUL"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: palette.fail } },
              String(redTeamRun.attacksSucceeded)
            )
          ),
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "SUCCESS RATE"),
            createElement(
              Text,
              {
                style: {
                  ...styles.statValue,
                  color: successRate > 0 ? palette.fail : palette.pass,
                },
              },
              formatPercent(successRate)
            )
          ),
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "CRITICAL FINDINGS"),
            createElement(
              Text,
              {
                style: {
                  ...styles.statValue,
                  color:
                    redTeamRun.criticalFindings > 0
                      ? palette.critical
                      : palette.pass,
                },
              },
              String(redTeamRun.criticalFindings)
            )
          )
        )
      ),

      createElement(
        View,
        { style: styles.section },
        createElement(
          Text,
          { style: styles.sectionTitle },
          `DETAILED FINDINGS (${findingsToRender.length} shown / ${findings.length} total)`
        ),
        ...(findingsToRender.length > 0
          ? findingsToRender.map((finding, index: number) => {
              const safeAttackType = sanitizeForPdf(
                finding.attack_type,
                MAX_ATTACK_TYPE_CHARS
              );
              const title = `${index + 1}. ${
                safeAttackType.replace(/_/g, " ").toUpperCase() ||
                "UNSPECIFIED ATTACK"
              }`;
              return createElement(
                View,
                { key: `${finding.attack_type}-${index}`, style: styles.resultCard },
                createElement(
                  View,
                  { style: styles.findingHeader },
                  createElement(Text, { style: styles.findingTitle }, title),
                  createElement(
                    Text,
                    { style: getSeverityStyle(finding.severity || "LOW") },
                    finding.severity || "LOW"
                  )
                ),
                createElement(
                  Text,
                  { style: styles.summaryText },
                  cleanReportText(finding.description) || "No description provided."
                ),
                finding.input
                  ? createElement(
                      View,
                      { style: styles.codeBlock },
                      createElement(Text, { style: styles.codeLabel }, "ATTACK INPUT"),
                      createElement(Text, { style: styles.codeText }, finding.input)
                    )
                  : null,
                finding.output
                  ? createElement(
                      View,
                      { style: styles.codeBlock },
                      createElement(Text, { style: styles.codeLabel }, "MODEL OUTPUT"),
                      createElement(Text, { style: styles.codeText }, finding.output)
                    )
                  : null
              );
            })
          : [
              createElement(
                View,
                { key: "no-findings", style: styles.card },
                createElement(
                  Text,
                  { style: styles.summaryText },
                  "No vulnerabilities were detected in this run. The model resisted all tested attack vectors."
                )
              ),
            ])
        ,
        omittedFindings > 0
          ? createElement(
              View,
              { key: "omitted-findings-note", style: styles.card },
              createElement(
                Text,
                { style: styles.mutedText },
                `Only the first ${MAX_RENDERED_FINDINGS} findings are shown in this PDF for stability. ${omittedFindings} additional findings are available in the run details.`
              )
            )
          : null
      ),

      createElement(
        View,
        { style: styles.footer, fixed: true },
        createElement(Text, {}, "Veridian AI Quality Infrastructure"),
        createElement(Text, { style: styles.footerPageNumber, render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}` })
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

  const rootCauseText = cleanReportText(run.agentRun?.rootCause || "");
  const redTeamSummary = cleanReportText(latestRedTeamRun?.reportSummary || "");

  const doc = createElement(
    Document,
    {},
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(
        View,
        { style: styles.headerCard },
        createElement(Text, { style: styles.title }, "Veridian Compliance Report"),
        createElement(
          Text,
          { style: styles.subtitle },
          "Evaluation quality report for deployment governance and audits"
        ),
        createElement(
          View,
          { style: styles.metaRow },
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, "RUN ID"),
            createElement(Text, { style: styles.metaValue }, run.id)
          ),
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, "GENERATED"),
            createElement(Text, { style: styles.metaValue }, generatedAt)
          ),
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, "SUITE"),
            createElement(Text, { style: styles.metaValue }, run.suite.name)
          ),
          createElement(
            View,
            { style: styles.metaItem },
            createElement(Text, { style: styles.metaLabel }, "MODEL"),
            createElement(Text, { style: styles.metaValue }, run.modelId)
          )
        )
      ),

      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "RUN SUMMARY"),
        createElement(
          View,
          { style: styles.statsRow },
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "OVERALL SCORE"),
            createElement(
              Text,
              {
                style: {
                  ...styles.statValue,
                  color: scoreColor(run.overallScore ?? 0),
                },
              },
              formatPercent(run.overallScore, 1)
            )
          ),
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "PASSED"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: palette.pass } },
              String(run.passedCount)
            )
          ),
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "FAILED"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: palette.fail } },
              String(run.failedCount)
            )
          ),
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "STATUS"),
            createElement(Text, { style: styles.statValue }, run.status.toUpperCase())
          )
        )
      ),

      createElement(
        View,
        { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "SEVERITY BREAKDOWN"),
        createElement(
          View,
          { style: styles.statsRow },
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "CRITICAL"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: palette.critical } },
              String(severityCounts.CRITICAL)
            )
          ),
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "HIGH"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: palette.high } },
              String(severityCounts.HIGH)
            )
          ),
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "MEDIUM"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: palette.medium } },
              String(severityCounts.MEDIUM)
            )
          ),
          createElement(
            View,
            { style: styles.statCard },
            createElement(Text, { style: styles.statLabel }, "LOW"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: palette.low } },
              String(severityCounts.LOW)
            )
          )
        )
      ),

      rootCauseText
        ? createElement(
            View,
            { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, "ROOT CAUSE ANALYSIS"),
            createElement(
              View,
              { style: styles.card },
              createElement(Text, { style: styles.summaryText }, rootCauseText)
            )
          )
        : null,

      latestRedTeamRun
        ? createElement(
            View,
            { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, "LATEST RED TEAM SIGNAL"),
            createElement(
              View,
              { style: styles.card },
              createElement(
                Text,
                { style: styles.summaryText },
                redTeamSummary ||
                  `Latest run: ${latestRedTeamRun.id}. Attacks generated: ${latestRedTeamRun.attacksGenerated}, succeeded: ${latestRedTeamRun.attacksSucceeded}, critical findings: ${latestRedTeamRun.criticalFindings}.`
              )
            )
          )
        : null,

      createElement(
        View,
        { style: styles.section },
        createElement(
          Text,
          { style: styles.sectionTitle },
          `TEST CASE RESULTS (${runResults.length})`
        ),
        ...runResults.map((result, index: number) =>
          createElement(
            View,
            { key: result.id, style: styles.resultCard },
            createElement(
              View,
              { style: styles.resultHeader },
              createElement(Text, { style: styles.resultTitle }, `Case ${index + 1}`),
              createElement(
                Text,
                { style: result.passed ? styles.statusPass : styles.statusFail },
                result.passed ? "PASS" : "FAIL"
              )
            ),
            createElement(Text, { style: styles.promptLabel }, "TEST INPUT"),
            createElement(
              Text,
              { style: styles.promptText },
              truncateText(result.testCase.input || "", 260)
            ),
            ...(result.metricScores.length > 0
              ? result.metricScores.map((metric, metricIndex: number) =>
                  createElement(
                    View,
                    { key: `${result.id}-${metricIndex}`, style: styles.metricItem },
                    createElement(
                      View,
                      { style: styles.metricHeader },
                      createElement(
                        Text,
                        { style: styles.metricName },
                        metric.metricName.replace(/_/g, " ")
                      ),
                      createElement(
                        Text,
                        {
                          style: {
                            ...styles.metricScore,
                            color: scoreColor(metric.score),
                          },
                        },
                        `${(metric.score * 100).toFixed(0)}%`
                      )
                    ),
                    createElement(
                      Text,
                      { style: styles.metricReason },
                      cleanReportText(metric.reason || "No explanation provided.")
                    )
                  )
                )
              : [
                  createElement(
                    Text,
                    { key: `${result.id}-no-metrics`, style: styles.mutedText },
                    "No metric-level scores were recorded for this test case."
                  ),
                ])
          )
        )
      ),

      createElement(
        View,
        { style: styles.footer, fixed: true },
        createElement(Text, {}, "Veridian AI Quality Infrastructure"),
        createElement(Text, { style: styles.footerPageNumber, render: ({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}` })
      )
    )
  );

  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}
