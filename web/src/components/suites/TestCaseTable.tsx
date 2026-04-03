"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { AddTestCaseForm } from "./AddTestCaseForm";
import { TestCase } from "@/hooks/useSuite";

export function TestCaseTable({ suiteId, testCases }: { suiteId: string; testCases: TestCase[] }) {
  const [expandedId, setExpandedId] = useState<string | null>("tc2");
  const queryClient = useQueryClient();

  const deleteTestCase = useMutation({
    mutationFn: async (tcId: string) => {
      const res = await fetch(`/api/suites/${suiteId}/test-cases/${tcId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to delete test case");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suite", suiteId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="w-full bg-[#111113] border border-[#1F1F23] rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-[#18181B] px-6 py-3 flex items-center border-b border-[#1F1F23]">
        <div className="w-10 text-[11px] font-medium text-[#52525B] uppercase tracking-wider font-sans">#</div>
        <div className="w-[40%] text-[11px] font-medium text-[#52525B] uppercase tracking-wider font-sans">Input</div>
        <div className="w-[35%] text-[11px] font-medium text-[#52525B] uppercase tracking-wider font-sans">Expected Output</div>
        <div className="w-[15%] text-[11px] font-medium text-[#52525B] uppercase tracking-wider font-sans">Tags</div>
        <div className="flex-1"></div>
      </div>

      {/* Rows */}
      {testCases.length === 0 ? (
        <div className="px-6 py-12 flex flex-col items-center justify-center border-b border-[#1F1F23]">
          <p className="text-[13px] text-[#A1A1AA] font-sans">No test cases yet. Add your first test case below.</p>
        </div>
      ) : (
        testCases.map((tc, index) => {
        const isExpanded = expandedId === tc.id;
        const rowNum = String(index + 1).padStart(2, '0');

        if (isExpanded) {
          return (
            <div key={tc.id} className="bg-[#18181B] border-l-[3px] border-[#8B5CF6] border-b border-[#1F1F23] flex relative px-6 pl-[48px] pt-5 pb-6">
              <div className="absolute left-6 font-mono text-[#8B5CF6] text-[13px]">{rowNum}</div>
              
              <div className="flex flex-col gap-6 w-full">
                <div>
                  <span className="text-[11px] text-[#52525B] uppercase tracking-wider font-sans mb-1 block">Input</span>
                  <p className="text-[14px] text-[#FAFAFA] font-sans leading-relaxed">{tc.input}</p>
                </div>
                <div>
                  <span className="text-[11px] text-[#52525B] uppercase tracking-wider font-sans mb-1 block">Expected Output</span>
                  <p className="text-[14px] text-[#A1A1AA] font-sans leading-relaxed">{tc.expectedOutput}</p>
                </div>
                {tc.context && (
                  <div className="border-l-2 border-[#27272A] pl-3">
                    <span className="text-[11px] text-[#52525B] uppercase font-sans mb-1 block tracking-wider">Context</span>
                    <span className="text-[13px] text-[#71717A] font-sans italic">{tc.context}</span>
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div 
            key={tc.id} 
            onClick={() => setExpandedId(expandedId === tc.id ? null : tc.id)}
            className="group px-6 py-4 border-b border-[#1F1F23] hover:bg-[#18181B] cursor-pointer flex items-center transition-colors"
          >
            <div className="w-10 font-mono text-[13px] text-[#52525B]">{rowNum}</div>
            <div className="w-[40%] pr-4 font-sans text-[14px] text-[#FAFAFA] line-clamp-2 leading-snug">{tc.input}</div>
            <div className="w-[35%] pr-4 font-sans text-[14px] text-[#A1A1AA] line-clamp-2 leading-snug">{tc.expectedOutput}</div>
            <div className="w-[15%] flex flex-wrap gap-2 pr-4">
              {tc.tags.map(tag => {
                 let tagClass = "bg-[#27272A]/50 text-[#FAFAFA]";
                 if (tag.includes("high-risk")) tagClass = "bg-[#EF4444]/10 text-[#EF4444]";
                 if (tag.includes("triage")) tagClass = "bg-[#8B5CF6]/10 text-[#8B5CF6]";
                 return (
                   <span key={tag} className={`rounded-[4px] px-2 py-0.5 font-mono text-[12px] whitespace-nowrap ${tagClass}`}>
                     {tag}
                   </span>
                 );
              })}
            </div>
            <div className="flex-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this test case? This cannot be undone.")) {
                    deleteTestCase.mutate(tc.id);
                  }
                }}
                disabled={deleteTestCase.isPending}
                className="cursor-pointer disabled:opacity-50"
              >
                <Trash className="w-[14px] h-[14px] text-[#3F3F46] hover:text-[#EF4444] transition-colors" />
              </button>
            </div>
          </div>
        );
      })
      )}

      {/* Inline Form */}
      <AddTestCaseForm suiteId={suiteId} />
    </div>
  );
}
