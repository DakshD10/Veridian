"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { TestCaseTable } from "@/components/suites/TestCaseTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useModels } from "@/hooks/useModels";

interface SuiteTestCase {
  id: string;
  suiteId: string;
  input: string;
  expectedOutput: string;
  context?: string;
  tags: string[];
}

interface SuiteDetail {
  id: string;
  name: string;
  domain: string | null;
  testCases: SuiteTestCase[];
}

function PageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 gap-6">
  <Skeleton className="h-25 w-full bg-[#111113]/50 rounded-lg" />
  <Skeleton className="h-100 w-full bg-[#111113]/50 rounded-lg" />
    </div>
  );
}

export default function SuiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [redTeamModelId, setRedTeamModelId] = useState("");
  const [isRedTeaming, setIsRedTeaming] = useState(false);
  const { data: models } = useModels();

  const {
    data: suite,
    isLoading,
    isError,
  } = useQuery<SuiteDetail>({
    queryKey: ["suite", id],
    queryFn: async () => {
      const res = await fetch(`/api/suites/${id}`);
      if (!res.ok) throw new Error("Failed to fetch suite");
      return res.json();
    },
    enabled: !!id,
  });

  async function handleRedTeam(suiteId: string) {
    if (!redTeamModelId || isRedTeaming) return;
    setIsRedTeaming(true);

    try {
      const res = await fetch(`/api/suites/${suiteId}/red-team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: redTeamModelId }),
      });

      if (!res.ok) throw new Error("Failed to start red team");

      const { redTeamRunId } = await res.json();
      router.push(`/red-team/${redTeamRunId}`);
    } catch {
      toast.error("Failed to start red team run");
      setIsRedTeaming(false);
    }
  }

  if (isLoading) return <PageSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <p className="text-xs text-muted-foreground mt-1">Check your connection and try refreshing.</p>
      </div>
    );
  }

  if (!suite) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-sm text-muted-foreground">Suite not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full">
      <div className="w-full bg-[#111113] border-b border-[#1F1F23] px-8 py-6 flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <Link href="/suites" className="font-sans text-[13px] text-[#52525B] hover:text-[#71717A] transition-colors">
            Eval Suites / {suite.name}
          </Link>
          <div className="flex flex-col gap-1.5 mt-1">
            <h1 className="font-sans text-[24px] font-bold text-[#FAFAFA]">{suite.name}</h1>
            <div className="flex items-center gap-2 font-sans text-[14px] text-[#71717A]">
              <span className="bg-[#71717A]/10 border border-[#71717A]/20 text-[#A1A1AA] text-[11px] font-medium uppercase px-2 py-0.5 rounded mr-1 leading-none tracking-wider">
                {suite.domain ?? "general"}
              </span>
              <span>{suite.testCases.length} test cases</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              document.getElementById("add-test-case-form")?.scrollIntoView({ behavior: "smooth" })
            }
            className="bg-transparent border border-[#27272A] text-[#A1A1AA] rounded-[6px] px-4 py-2 font-sans text-[14px] font-medium hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            Add Test Case
          </button>
          <Link
            href={`/suites/${suite.id}/run`}
            className="bg-[#8B5CF6] text-white rounded-[6px] px-4 py-2 font-sans text-[14px] font-medium hover:bg-violet-600 transition-colors cursor-pointer"
          >
            Run Suite →
          </Link>
        </div>
      </div>

  <div className="p-8 flex flex-col w-full grow pb-16">
        <div className="flex flex-col gap-3 p-4 mb-6 bg-[#111113] border border-[#27272A] rounded-lg">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-red-400" />
            <span className="text-sm font-medium text-[#FAFAFA]">Red Team Analysis</span>
          </div>
          <p className="text-xs text-[#71717A]">
            Adversarially test this suite — find vulnerabilities standard eval misses.
          </p>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={redTeamModelId}
                onChange={(e) => setRedTeamModelId(e.target.value)}
                className="appearance-none bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2 pr-8 text-sm text-[#A1A1AA] focus:outline-none focus:border-red-500/40"
                disabled={suite.testCases.length === 0}
                title={suite.testCases.length === 0 ? "Add test cases first" : undefined}
              >
                <option value="">Select model to attack</option>
                {models
                  ?.filter((model) => model.provider !== "custom")
                  .map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label}
                    </option>
                  ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleRedTeam(suite.id)}
              disabled={!redTeamModelId || isRedTeaming || suite.testCases.length === 0}
              title={suite.testCases.length === 0 ? "Add test cases first" : undefined}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-red-500/40 hover:bg-red-950/20 text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRedTeaming ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Shield size={14} />
                  Red Team
                </>
              )}
            </button>
          </div>
        </div>

        <TestCaseTable suiteId={suite.id} testCases={suite.testCases || []} />
      </div>
    </div>
  );
}
