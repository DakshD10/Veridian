"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const AddTestCaseSchema = z.object({
  input: z.string().min(1, "Input is required"),
  expectedOutput: z.string().min(1, "Expected output is required"),
  context: z.string().optional(),
  tags: z.string(),
});

type AddTestCaseFormValues = z.infer<typeof AddTestCaseSchema>;

export function AddTestCaseForm({ suiteId }: { suiteId: string }) {
  const queryClient = useQueryClient();

  const form = useForm<AddTestCaseFormValues>({
    resolver: zodResolver(AddTestCaseSchema),
    defaultValues: {
      input: "",
      expectedOutput: "",
      context: "",
      tags: "",
    },
  });

  const addTestCase = useMutation({
    mutationFn: async (data: {
      input: string;
      expectedOutput: string;
      context?: string;
      tags: string;
    }) => {
      const res = await fetch(`/api/suites/${suiteId}/test-cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: data.input,
          expectedOutput: data.expectedOutput,
          context: data.context || undefined,
          tags: data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to add test case");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suite", suiteId] });
      form.reset();
    },
    onError: () => {
      form.setError("root", {
        type: "server",
        message: "Failed to add test case. Please check your input and try again.",
      });
    },
  });

  const onSubmit = (data: AddTestCaseFormValues) => {
    form.clearErrors("root");
    addTestCase.mutate(data);
  };

  return (
    <form
      id="add-test-case-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="bg-[#09090B] px-6 py-4 border-t border-[#1F1F23]"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_2fr_2fr_1fr_auto] md:items-start">
        <div>
          <input
            {...form.register("input")}
            placeholder="Input..."
            className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-9 px-3 text-[14px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#8B5CF6] font-sans"
          />
          {form.formState.errors.input && (
            <p className="mt-1 text-xs text-[#EF4444]">
              {form.formState.errors.input.message}
            </p>
          )}
        </div>

        <div>
          <input
            {...form.register("expectedOutput")}
            placeholder="Expected Output..."
            className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-9 px-3 text-[14px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#8B5CF6] font-sans"
          />
          {form.formState.errors.expectedOutput && (
            <p className="mt-1 text-xs text-[#EF4444]">
              {form.formState.errors.expectedOutput.message}
            </p>
          )}
        </div>

        <div>
          <input
            {...form.register("context")}
            placeholder="Context (optional)..."
            className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-9 px-3 text-[14px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#8B5CF6] font-sans"
          />
        </div>

        <div>
          <input
            {...form.register("tags")}
            placeholder="tag1, tag2"
            className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-9 px-3 text-[14px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#8B5CF6] font-sans"
          />
        </div>

        <button
          type="submit"
          disabled={addTestCase.isPending}
          className="bg-[#8B5CF6] text-white rounded-[6px] h-9 px-4 font-sans text-[13px] font-medium hover:bg-violet-600 transition-colors cursor-pointer disabled:opacity-50"
        >
          {addTestCase.isPending ? "Adding..." : "Add"}
        </button>
      </div>

      {form.formState.errors.root && (
        <p className="mt-3 text-sm text-[#EF4444]">
          {form.formState.errors.root.message}
        </p>
      )}
    </form>
  );
}
