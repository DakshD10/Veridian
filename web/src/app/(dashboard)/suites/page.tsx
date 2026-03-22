"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useSuites } from "@/hooks/useSuites";
import { SuiteCard } from "@/components/suites/SuiteCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function SuitesPage() {
  const {
    data: suites = [],
    isLoading,
    isError,
  } = useSuites();

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 gap-4">
        <Skeleton className="h-[300px] w-full bg-[#111113]/60 rounded-lg" />
        <Skeleton className="h-[300px] w-full bg-[#111113]/60 rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <p className="text-xs text-muted-foreground mt-1">Check your connection and try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8">
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col">
          <h1 className="font-sans text-[20px] font-bold text-[#FAFAFA]">Eval Suites</h1>
          <span className="font-sans text-[14px] text-[#71717A] mt-1">
            {suites.length} suites · {suites.reduce((sum, suite) => sum + (suite._count?.testCases ?? 0), 0)} total test cases
          </span>
        </div>
        <Link
          href="/suites/new"
          className="bg-[#8B5CF6] text-white px-4 py-2 rounded-[6px] text-[14px] font-medium flex items-center gap-2 hover:bg-violet-600 transition-colors font-sans"
        >
          <Plus className="w-4 h-4" />
          New Suite
        </Link>
      </div>

      {suites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <p className="text-sm text-muted-foreground">No suites yet. Create your first eval suite.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suites.map((suite) => (
            <SuiteCard key={suite.id} suite={suite} />
          ))}
        </div>
      )}
    </div>
  );
}
