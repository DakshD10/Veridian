import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import { createElement } from "react";
import { prisma } from "@/lib/prisma";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#18181B",
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#18181B",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#71717A",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#18181B",
    marginBottom: 8,
    backgroundColor: "#F4F4F5",
    padding: 6,
  },
  statRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 4,
    padding: 8,
  },
  statLabel: {
    fontSize: 8,
    color: "#71717A",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#18181B",
  },
  testCaseBox: {
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 4,
    marginBottom: 10,
    padding: 10,
  },
  testCaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  testCaseInput: {
    fontSize: 9,
    color: "#18181B",
    marginBottom: 4,
    flex: 1,
  },
  passedBadge: {
    fontSize: 8,
    color: "#16A34A",
    fontFamily: "Helvetica-Bold",
  },
  failedBadge: {
    fontSize: 8,
    color: "#DC2626",
    fontFamily: "Helvetica-Bold",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
  },
  metricName: {
    fontSize: 8,
    color: "#52525B",
    width: 100,
    textTransform: "capitalize",
  },
  metricScore: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    width: 40,
    textAlign: "right",
  },
  metricReason: {
    fontSize: 7,
    color: "#71717A",
    flex: 1,
    paddingLeft: 8,
    fontStyle: "italic",
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
  if (score >= 0.7) return "#16A34A";
  if (score >= 0.5) return "#D97706";
  return "#DC2626";
}

export async function generateComplianceReport(
  runId: string
): Promise<Buffer> {
  Font.registerHyphenationCallback((word) => [word]);

  const run = await prisma.evalRun.findUnique({
    where: { id: runId },
    include: {
      suite: true,
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
        createElement(Text, { style: styles.title }, "Veridian Compliance Report"),
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
              { style: { ...styles.statValue, color: "#16A34A" } },
              String(run.passedCount)
            )
          ),
          createElement(
            View,
            { style: styles.statBox },
            createElement(Text, { style: styles.statLabel }, "Failed"),
            createElement(
              Text,
              { style: { ...styles.statValue, color: "#DC2626" } },
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
        createElement(
          Text,
          { style: styles.sectionTitle },
          `Test Case Results (${run.results.length} cases)`
        ),
        ...run.results.map((result, index) =>
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
              Text,
              {
                style: {
                  fontSize: 8,
                  color: scoreColor(result.overallScore),
                  marginBottom: 4,
                },
              },
              `Overall: ${(result.overallScore * 100).toFixed(1)}%`
            ),
            ...result.metricScores.map((metric) =>
              createElement(
                View,
                { key: metric.id, style: styles.metricRow },
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
                ),
                createElement(
                  Text,
                  { style: styles.metricReason },
                  metric.reason ?? "No reason provided"
                )
              )
            )
          )
        )
      ),
      createElement(
        View,
        { style: styles.footer },
        createElement(
          Text,
          {},
          "Veridian AI Quality Infrastructure · DPDP Audit Ready"
        ),
        createElement(Text, {}, `Run ID: ${run.id}`)
      )
    )
  );

  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}
