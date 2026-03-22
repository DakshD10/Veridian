"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { TestCaseTable } from "@/components/suites/TestCaseTable";
import { Skeleton } from "@/components/ui/skeleton";

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
      <Skeleton className="h-[100px] w-full bg-[#111113]/50 rounded-lg" />
      <Skeleton className="h-[400px] w-full bg-[#111113]/50 rounded-lg" />
    </div>
  );
}

export default function SuiteDetailPage() {
  const params = useParams();
  const id = params.id as string;

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

      <div className="p-8 flex flex-col w-full flex-grow pb-16">
        {!suite.testCases || suite.testCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
            <p className="text-sm text-muted-foreground">No test cases yet. Add your first test case below.</p>
          </div>
        ) : (
          <TestCaseTable suiteId={suite.id} testCases={suite.testCases} />
        )}
      </div>
    </div>
  );
}
