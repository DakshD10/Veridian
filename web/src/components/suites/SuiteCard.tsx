"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlaskConical, History } from "lucide-react";
import { Suite } from "@/hooks/useSuites";

export function SuiteCard({ suite }: { suite: Suite }) {
  const router = useRouter();

  const domain = suite.domain ?? "general";

  return (
    <div
      onClick={() => router.push(`/suites/${suite.id}`)}
      className="bg-[#111113] border border-[#1F1F23] rounded-lg p-6 cursor-pointer hover:border-[#27272A] transition-colors duration-200"
    >
      <span className="rounded px-2 flex items-center justify-center font-sans font-medium text-[11px] uppercase border h-5 bg-[#71717A]/10 border-[#71717A]/20 text-[#A1A1AA] w-fit">
        {domain}
      </span>

      <h3 className="font-sans font-semibold text-base text-[#FAFAFA] mt-3">{suite.name}</h3>

      <div className="w-full border-b border-[#1F1F23] my-4" />

      <div className="flex items-center gap-4 text-[#A1A1AA] w-full">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-[#52525B]" />
          <span className="font-sans text-[13px] font-normal">{suite._count?.testCases ?? 0} test cases</span>
        </div>
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-[#52525B]" />
          <span className="font-sans text-[13px] font-normal">{suite._count?.runs ?? 0} runs</span>
        </div>
      </div>

      <div className="mt-4 w-full flex justify-end">
        <Link
          href={`/suites/${suite.id}/run`}
          onClick={(e) => e.stopPropagation()}
          className="font-sans font-medium text-[13px] text-[#8B5CF6] hover:underline cursor-pointer"
        >
          Run Suite →
        </Link>
      </div>
    </div>
  );
}
