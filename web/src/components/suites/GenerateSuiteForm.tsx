"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Sparkles,
  Trash2,
  RefreshCw,
  Loader2,
  ChevronDown,
} from "lucide-react";
import type { EditableTestCase, GenerateSuiteResponse } from "@/types";

const GenerateFormSchema = z.object({
  description: z
    .string()
    .min(10, "Describe what you want to test in at least 10 characters"),
  domain: z.enum(["healthcare", "bfsi", "hiring", "general", ""]).optional(),
});

type GenerateFormValues = z.infer<typeof GenerateFormSchema>;

function shortId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function descriptionToSuiteName(description: string): string {
  const trimmed = description.trim().slice(0, 60);
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

const DOMAIN_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "healthcare", label: "Healthcare" },
  { value: "bfsi", label: "BFSI (Finance)" },
  { value: "hiring", label: "Hiring" },
  { value: "general", label: "General" },
] as const;

export function GenerateSuiteForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<"input" | "preview">("input");
  const [cases, setCases] = useState<EditableTestCase[]>([]);
  const [detectedDomain, setDetectedDomain] = useState<string>("");
  const [suiteName, setSuiteName] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GenerateFormValues>({
    resolver: zodResolver(GenerateFormSchema),
    defaultValues: { description: "", domain: "" },
  });

  const description = watch("description");

  const generateMutation = useMutation({
    mutationFn: async (values: GenerateFormValues) => {
      const res = await fetch("/api/suites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: values.description,
          domain: values.domain || undefined,
          count: 10,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(err.error ?? "Generation failed");
      }
      return (await res.json()) as GenerateSuiteResponse;
    },
    onSuccess: (data) => {
      const editable: EditableTestCase[] = data.test_cases.map((tc) => ({
        _localId: shortId(),
        _deleted: false,
        input: tc.input,
        expectedOutput: tc.expected_output,
        context: tc.context ?? null,
        tags: tc.tags ?? [],
      }));
      setCases(editable);
      setDetectedDomain(data.domain);
      setSuiteName(descriptionToSuiteName(description));
      setPhase("preview");
    },
    onError: (err: Error) => {
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const activeCases = cases.filter((c) => !c._deleted);
      if (activeCases.length === 0) throw new Error("No test cases to save");
      if (!suiteName.trim()) throw new Error("Suite name is required");

      const suiteRes = await fetch("/api/suites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: suiteName.trim(),
          description: `Generated from: ${description.slice(0, 120)}`,
          domain: detectedDomain || "general",
        }),
      });
      if (!suiteRes.ok) throw new Error("Failed to create suite");
      const suite = (await suiteRes.json()) as { id: string };

      for (const tc of activeCases) {
        const tcRes = await fetch(`/api/suites/${suite.id}/test-cases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            context: tc.context || undefined,
            tags: tc.tags,
          }),
        });
        if (!tcRes.ok) {
          throw new Error(`Failed to save test case: ${tc.input.slice(0, 40)}...`);
        }
      }

      return suite;
    },
    onSuccess: (suite) => {
      toast.success(
        `Suite saved - ${cases.filter((c) => !c._deleted).length} test cases`
      );
      router.push(`/suites/${suite.id}`);
    },
    onError: (err: Error) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  function updateCase(
    localId: string,
    field: "input" | "expectedOutput" | "context",
    value: string
  ) {
    setCases((prev) =>
      prev.map((c) => (c._localId === localId ? { ...c, [field]: value } : c))
    );
  }

  function deleteCase(localId: string) {
    setCases((prev) =>
      prev.map((c) => (c._localId === localId ? { ...c, _deleted: true } : c))
    );
  }

  function handleRegenerate() {
    setPhase("input");
    setCases([]);
  }

  const activeCases = cases.filter((c) => !c._deleted);

  if (phase === "input") {
    return (
      <form
        onSubmit={handleSubmit((v) => generateMutation.mutate(v))}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wide text-[#71717A]">
            Describe what you want to test *
          </label>
          <textarea
            {...register("description")}
            rows={4}
            placeholder="e.g. Test a medical triage AI that assesses emergency room patients by severity. Include edge cases for cardiac presentations, pediatric patients, and atypical symptoms."
            className="bg-[#18181B] border border-[#27272A] rounded-md px-3 py-3
                       text-sm text-[#FAFAFA] placeholder:text-[#52525B] leading-relaxed
                       resize-none focus:outline-none focus:border-violet-500/50"
          />
          {errors.description && (
            <p className="text-red-400 text-xs">{errors.description.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-wide text-[#71717A]">
            Domain
            <span className="ml-1 normal-case text-[#52525B]">
              (optional - auto-detected from description)
            </span>
          </label>
          <div className="relative w-48">
            <select
              {...register("domain")}
              className="w-full appearance-none bg-[#18181B] border border-[#27272A]
                         rounded-md px-3 py-2 pr-8 text-sm text-[#A1A1AA]
                         focus:outline-none focus:border-violet-500/50"
            >
              {DOMAIN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2
                         text-[#71717A] pointer-events-none"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-md text-sm
                       font-medium bg-violet-600 hover:bg-violet-500 text-white
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating test cases...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate 10 Test Cases
              </>
            )}
          </button>

          {generateMutation.isPending && (
            <p className="mt-3 text-xs text-[#71717A] flex items-center gap-1.5">
              <span
                className="inline-block w-1 h-1 rounded-full bg-violet-500 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="inline-block w-1 h-1 rounded-full bg-violet-500 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="inline-block w-1 h-1 rounded-full bg-violet-500 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
              <span className="ml-1">
                Generating your eval suite - this takes 5-15 seconds
              </span>
            </p>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between p-3 bg-violet-500/8 border border-violet-500/20 rounded-md">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-violet-400 shrink-0" />
          <span className="text-sm text-violet-300">
            Generated {activeCases.length} test cases
          </span>
          {detectedDomain && (
            <span className="px-2 py-0.5 text-xs rounded bg-violet-500/15 text-violet-400 border border-violet-500/25">
              {detectedDomain}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleRegenerate}
          className="flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors"
        >
          <RefreshCw size={12} />
          Regenerate
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wide text-[#71717A]">
          Suite Name *
        </label>
        <input
          value={suiteName}
          onChange={(e) => setSuiteName(e.target.value)}
          placeholder="Enter a name for this suite"
          className="bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2
                     text-sm text-[#FAFAFA] placeholder:text-[#52525B]
                     focus:outline-none focus:border-violet-500/50 max-w-xl"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-[#71717A]">
            Test Cases
            <span className="ml-2 normal-case text-[#52525B]">
              - click any cell to edit - {activeCases.length} active
            </span>
          </p>
        </div>

        <div className="border border-[#27272A] rounded-lg overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-[#27272A] text-xs uppercase tracking-wide text-[#71717A]">
            <div className="bg-[#111113] px-3 py-2">Input</div>
            <div className="bg-[#111113] px-3 py-2">Expected Output</div>
            <div className="bg-[#111113] px-3 py-2">Context / Tags</div>
            <div className="bg-[#111113] px-3 py-2 w-10" />
          </div>

          {cases
            .filter((c) => !c._deleted)
            .map((tc, index) => (
              <div
                key={tc._localId}
                className={`
                  grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-[#27272A]
                  ${index % 2 === 0 ? "bg-opacity-100" : "bg-opacity-50"}
                `}
              >
                <div className="bg-[#111113] px-3 py-2">
                  <textarea
                    value={tc.input}
                    onChange={(e) => updateCase(tc._localId, "input", e.target.value)}
                    rows={3}
                    className="w-full bg-transparent text-xs text-[#FAFAFA]
                               resize-none focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="bg-[#111113] px-3 py-2">
                  <textarea
                    value={tc.expectedOutput}
                    onChange={(e) =>
                      updateCase(tc._localId, "expectedOutput", e.target.value)
                    }
                    rows={3}
                    className="w-full bg-transparent text-xs text-[#A1A1AA]
                               resize-none focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="bg-[#111113] px-3 py-2 flex flex-col gap-2">
                  <textarea
                    value={tc.context ?? ""}
                    onChange={(e) => updateCase(tc._localId, "context", e.target.value)}
                    rows={2}
                    placeholder="Context..."
                    className="w-full bg-transparent text-xs text-[#71717A]
                               resize-none focus:outline-none leading-relaxed
                               placeholder:text-[#52525B]"
                  />
                  <div className="flex flex-wrap gap-1">
                    {tc.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 text-xs rounded bg-[#27272A] text-[#71717A]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111113] px-2 py-2 flex items-start justify-center">
                  <button
                    type="button"
                    onClick={() => deleteCase(tc._localId)}
                    className="p-1 text-[#52525B] hover:text-red-400 transition-colors rounded"
                    title="Remove this test case"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
        </div>

        {activeCases.length === 0 && (
          <p className="text-xs text-[#71717A] text-center py-4">
            All test cases removed. Click Regenerate to start over.
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-[#1F1F23]">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || activeCases.length === 0 || !suiteName.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-md text-sm
                     font-medium bg-violet-600 hover:bg-violet-500 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving {activeCases.length} test cases...
            </>
          ) : (
            `Save Suite (${activeCases.length} cases)`
          )}
        </button>

        <button
          type="button"
          onClick={handleRegenerate}
          disabled={saveMutation.isPending}
          className="px-4 py-2 rounded-md text-sm border border-[#27272A]
                     hover:bg-[#18181B] text-[#A1A1AA] transition-colors
                     disabled:opacity-40"
        >
          Start Over
        </button>

        <p className="text-xs text-[#71717A]">
          {activeCases.length} of {cases.length} cases will be saved
        </p>
      </div>
    </div>
  );
}
