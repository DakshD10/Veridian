"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useSuites } from "@/hooks/useSuites";
import { SuiteCard } from "@/components/suites/SuiteCard";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/layout/PageLayout";

export default function SuitesPage() {
  const {
    data: suites = [],
    isLoading,
    isError,
  } = useSuites();

  if (isLoading) {
    return (
      <PageLayout 
        title="Eval Suites"
        actionButton={{ href: "/suites/new", label: "New Suite", icon: <Plus className="w-4 h-4" /> }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[300px] w-full bg-[#111113]/60 rounded-lg" />
          <Skeleton className="h-[300px] w-full bg-[#111113]/60 rounded-lg" />
        </div>
      </PageLayout>
    );
  }

  if (isError) {
    return (
      <PageLayout title="Eval Suites">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-destructive">Failed to load data.</p>
          <p className="text-xs text-muted-foreground mt-1">Check your connection and try refreshing.</p>
        </div>
      </PageLayout>
    );
  }

  const totalCases = suites.reduce((sum, suite) => sum + (suite._count?.testCases ?? 0), 0);

  return (
    <PageLayout 
      title="Eval Suites"
      subtitle={`${suites.length} suites · ${totalCases} total test cases`}
      actionButton={{ href: "/suites/new", label: "New Suite", icon: <Plus className="w-4 h-4" /> }}
      stats={[
        { label: "TOTAL SUITES", value: suites.length },
        { label: "TOTAL TEST CASES", value: totalCases },
        { label: "ACTIVE SUITES", value: suites.length },
        { label: "AVG CASES/SUITE", value: suites.length > 0 ? (totalCases / suites.length).toFixed(1) : 0 }
      ]}
    >
      {suites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <p className="text-sm text-muted-foreground">No suites yet. Create your first eval suite.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suites.map((suite, index) => (
            <SuiteCard key={suite.id} suite={suite} index={index} />
          ))}
        </div>
      )}
    </PageLayout>
  );
}
