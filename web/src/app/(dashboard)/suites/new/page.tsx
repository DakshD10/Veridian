"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const CreateSuiteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  domain: z.enum(["healthcare", "bfsi", "hiring", "general"]).optional(),
});

type CreateSuiteFormValues = z.infer<typeof CreateSuiteSchema>;

export default function NewSuitePage() {
  const router = useRouter();

  const form = useForm<CreateSuiteFormValues>({
    resolver: zodResolver(CreateSuiteSchema),
    defaultValues: {
      name: "",
      description: "",
      domain: "general",
    },
  });

  const createSuite = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      domain?: string;
    }) => {
      const res = await fetch("/api/suites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create suite");
      return res.json();
    },
    onSuccess: (suite) => {
      router.push(`/suites/${suite.id}`);
    },
    onError: () => {
      form.setError("root", {
        type: "server",
        message: "Failed to create suite. Please try again.",
      });
    },
  });

  const onSubmit = (values: CreateSuiteFormValues) => {
    form.clearErrors("root");
    createSuite.mutate(values);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-sans text-[24px] font-bold text-[#FAFAFA]">Create New Eval Suite</h1>
          <Link href="/suites" className="text-[#71717A] hover:text-[#FAFAFA] transition-colors">
            Cancel
          </Link>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6 bg-[#111113] border border-[#1F1F23] rounded-xl p-8"
        >
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[12px] font-medium text-[#52525B] uppercase tracking-wider">
              Suite Name
            </label>
            <input
              {...form.register("name")}
              placeholder="e.g. Medical Triage Safety"
              className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-11 px-4 text-[14px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#8B5CF6] font-sans"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-[#EF4444]">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[12px] font-medium text-[#52525B] uppercase tracking-wider">
              Domain
            </label>
            <select
              {...form.register("domain")}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-11 px-4 text-[14px] text-[#FAFAFA] focus:outline-none focus:border-[#8B5CF6] font-sans"
            >
              <option value="general">General</option>
              <option value="healthcare">Healthcare</option>
              <option value="bfsi">BFSI</option>
              <option value="hiring">Hiring</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[12px] font-medium text-[#52525B] uppercase tracking-wider">
              Description
            </label>
            <textarea
              {...form.register("description")}
              placeholder="What does this suite evaluate?"
              rows={4}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] px-4 py-3 text-[14px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#8B5CF6] font-sans resize-none"
            />
          </div>

          {form.formState.errors.root && (
            <p className="text-sm text-[#EF4444]">{form.formState.errors.root.message}</p>
          )}

          <button
            type="submit"
            disabled={createSuite.isPending}
            className="bg-[#8B5CF6] text-white rounded-[8px] h-11 font-sans text-[14px] font-semibold hover:bg-violet-600 transition-colors disabled:opacity-40"
          >
            {createSuite.isPending ? "Creating..." : "Create Suite"}
          </button>
        </form>
      </div>
    </div>
  );
}
