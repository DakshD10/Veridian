"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";

interface SuiteOption {
  id: string;
  name: string;
}

interface ModelOption {
  id: string;
  label: string;
}

const CreateDeploymentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  suiteId: z.string().min(1, "Suite is required"),
  currentModel: z.string().min(1, "Model is required"),
  threshold: z.number().min(0).max(1).default(0.75),
  slackWebhookUrl: z
    .string()
    .url("Slack webhook must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type CreateDeploymentFormValues = z.infer<typeof CreateDeploymentSchema>;
type CreateDeploymentFormInput = z.input<typeof CreateDeploymentSchema>;
type CreateDeploymentFormOutput = z.output<typeof CreateDeploymentSchema>;

function PageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 gap-6">
      <Skeleton className="h-[100px] w-full bg-[#111113]/50 rounded-lg" />
      <Skeleton className="h-[320px] w-full bg-[#111113]/50 rounded-lg" />
    </div>
  );
}

export default function NewDeploymentPage() {
  const router = useRouter();

  const {
    data: suites = [],
    isLoading: suitesLoading,
    isError: suitesError,
  } = useQuery<SuiteOption[]>({
    queryKey: ["suites"],
    queryFn: async () => {
      const res = await fetch("/api/suites");
      if (!res.ok) throw new Error("Failed to fetch suites");
      return res.json();
    },
  });

  const {
    data: models = [],
    isLoading: modelsLoading,
    isError: modelsError,
  } = useQuery<ModelOption[]>({
    queryKey: ["models"],
    queryFn: async () => {
      const res = await fetch("/api/models");
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
  });

  const form = useForm<
    CreateDeploymentFormInput,
    undefined,
    CreateDeploymentFormOutput
  >({
    resolver: zodResolver(CreateDeploymentSchema),
    defaultValues: {
      name: "",
      suiteId: "",
      currentModel: "",
      threshold: 0.75,
      slackWebhookUrl: "",
    },
  });

  const createDeployment = useMutation({
    mutationFn: async (data: CreateDeploymentFormValues) => {
      const payload = {
        name: data.name,
        suiteId: data.suiteId,
        currentModel: data.currentModel,
        threshold: data.threshold,
        slackWebhookUrl: data.slackWebhookUrl || undefined,
      };

      const res = await fetch("/api/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create deployment");
      return res.json();
    },
    onSuccess: (deployment) => {
      router.push(`/deployments/${deployment.id}`);
    },
    onError: () => {
      form.setError("root", {
        type: "server",
        message: "Failed to create deployment. Please try again.",
      });
    },
  });

  if (suitesLoading || modelsLoading) return <PageSkeleton />;

  if (suitesError || modelsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">Failed to load data.</p>
        <p className="text-xs text-muted-foreground mt-1">Check your connection and try refreshing.</p>
      </div>
    );
  }

  if (!suites.length || !models.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-sm text-muted-foreground">Create at least one suite and ensure models are available before creating a deployment.</p>
      </div>
    );
  }

  const onSubmit = (values: CreateDeploymentFormOutput) => {
    form.clearErrors("root");
    createDeployment.mutate(values);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-sans text-[24px] font-bold text-[#FAFAFA]">Watch New Deployment</h1>
          <Link href="/deployments" className="text-[#71717A] hover:text-[#FAFAFA] transition-colors">
            Cancel
          </Link>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6 bg-[#111113] border border-[#1F1F23] rounded-xl p-8"
        >
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[12px] font-medium text-[#52525B] uppercase tracking-wider">
              Deployment Name
            </label>
            <input
              {...form.register("name")}
              placeholder="e.g. Healthcare Prod V4"
              className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-11 px-4 text-[14px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#8B5CF6] font-sans"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-[#EF4444]">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[12px] font-medium text-[#52525B] uppercase tracking-wider">
              Eval Suite
            </label>
            <select
              {...form.register("suiteId")}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-11 px-4 text-[14px] text-[#FAFAFA] focus:outline-none focus:border-[#8B5CF6] font-sans"
            >
              <option value="">Select a suite...</option>
              {suites.map((suite) => (
                <option key={suite.id} value={suite.id}>
                  {suite.name}
                </option>
              ))}
            </select>
            {form.formState.errors.suiteId && (
              <p className="text-xs text-[#EF4444]">{form.formState.errors.suiteId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[12px] font-medium text-[#52525B] uppercase tracking-wider">
              Target Model
            </label>
            <select
              {...form.register("currentModel")}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-11 px-4 text-[14px] text-[#FAFAFA] focus:outline-none focus:border-[#8B5CF6] font-sans"
            >
              <option value="">Select a model...</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
            {form.formState.errors.currentModel && (
              <p className="text-xs text-[#EF4444]">{form.formState.errors.currentModel.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[12px] font-medium text-[#52525B] uppercase tracking-wider">
              Threshold
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              {...form.register("threshold", { valueAsNumber: true })}
              className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-11 px-4 text-[14px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#8B5CF6] font-sans"
            />
            {form.formState.errors.threshold && (
              <p className="text-xs text-[#EF4444]">{form.formState.errors.threshold.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-[12px] font-medium text-[#52525B] uppercase tracking-wider">
              Slack Webhook URL (optional)
            </label>
            <input
              {...form.register("slackWebhookUrl")}
              placeholder="https://hooks.slack.com/..."
              className="w-full bg-[#09090B] border border-[#27272A] rounded-[6px] h-11 px-4 text-[14px] text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:border-[#8B5CF6] font-sans"
            />
            {form.formState.errors.slackWebhookUrl && (
              <p className="text-xs text-[#EF4444]">{form.formState.errors.slackWebhookUrl.message}</p>
            )}
          </div>

          {form.formState.errors.root && (
            <p className="text-sm text-[#EF4444]">{form.formState.errors.root.message}</p>
          )}

          <button
            type="submit"
            disabled={createDeployment.isPending}
            className="bg-[#8B5CF6] text-white rounded-[8px] h-11 font-sans text-[14px] font-semibold hover:bg-violet-600 transition-colors disabled:opacity-40"
          >
            {createDeployment.isPending ? "Creating..." : "Start Watching"}
          </button>
        </form>
      </div>
    </div>
  );
}
