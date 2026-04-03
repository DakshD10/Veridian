"use client"

import { Search } from "lucide-react"

interface RootCauseCardProps {
  rootCause: string | null | undefined
  failureClusters?: string[]
  regressionFound: boolean
}

export function RootCauseCard({
  rootCause,
  failureClusters = [],
  regressionFound,
}: RootCauseCardProps) {
  // Don't render if no regression or no root cause
  if (!regressionFound || !rootCause || rootCause.trim() === "") {
    return null
  }

  // Don't render the "skipped" message — only real analysis
  if (rootCause.startsWith("No regression detected")) {
    return null
  }

  return (
    <div
      className="flex flex-col gap-4 p-4
                    bg-[#121215] border border-[#27272A] rounded-lg
                    border-l-4 border-l-red-500"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search size={14} className="text-red-400 shrink-0" />
        <span className="text-[#FAFAFA] font-semibold text-sm">
          Root Cause Analysis
        </span>
      </div>

      {/* Root cause text */}
      <p
        className="text-[#A1A1AA] text-sm leading-relaxed
                    border-l-2 border-[#27272A] pl-3"
      >
        {rootCause}
      </p>

      {/* Failure cluster badges */}
      {failureClusters.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-[#71717A]">
            Failure Patterns
          </span>
          <div className="flex flex-wrap gap-2">
            {failureClusters.map((cluster, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded text-xs font-medium
                           bg-amber-950/40 text-amber-400
                           border border-amber-500/30"
              >
                {cluster}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
