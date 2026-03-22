interface RegressionAlertProps {
  previousScore: number;
  newScore: number;
  threshold: number;
  reportSummary: string | null;
}

export function RegressionAlert({
  previousScore,
  newScore,
  threshold,
  reportSummary,
}: RegressionAlertProps) {
  if (!(previousScore > newScore && newScore < threshold)) {
    return null;
  }

  return (
    <div className="w-full rounded-lg bg-red-600 text-white px-4 py-4 border border-red-400">
      <p className="text-sm font-semibold">
        ⚠️ REGRESSION DETECTED — Score dropped {previousScore.toFixed(2)} → {newScore.toFixed(2)}. Rollback recommended.
      </p>
      {reportSummary && <p className="text-xs mt-2 text-red-100">{reportSummary}</p>}
    </div>
  );
}
