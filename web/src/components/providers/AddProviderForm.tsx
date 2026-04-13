"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ProviderTemplates } from "./ProviderTemplates";
import { ConnectionTestButton } from "./ConnectionTestButton";
import { useCreateProvider } from "@/hooks/useProviders";
import type { ProviderTemplate } from "@/lib/providers";

const FormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  baseUrl: z.string().url("Must be a valid URL"),
  modelId: z.string().min(1, "Model ID is required"),
  apiKey: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface AddProviderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddProviderForm({ onSuccess, onCancel }: AddProviderFormProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [connectionPassed, setConnectionPassed] = useState(false);
  const createProvider = useCreateProvider();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      baseUrl: "",
      modelId: "",
      apiKey: "",
      description: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const baseUrl = watch("baseUrl");
  const modelId = watch("modelId");
  const apiKey = watch("apiKey");

  function handleTemplateSelect(template: ProviderTemplate) {
    setSelectedTemplate(template.id);
    setValue("baseUrl", template.baseUrl);
    setValue("modelId", template.modelId);
    setValue("apiKey", template.apiKey);
    // Reset connection test when template changes
    setConnectionPassed(false);
  }

  // Reset connection test when URL or modelId changes
  function handleFieldChange() {
    setConnectionPassed(false);
  }

  async function onSubmit(values: FormValues) {
    try {
      await createProvider.mutateAsync({
        name: values.name,
        baseUrl: values.baseUrl,
        modelId: values.modelId,
        apiKey: values.apiKey || undefined,
        description: values.description || undefined,
        providerType: selectedTemplate ?? "openai-compatible",
      });
      toast.success("Provider added successfully");
      onSuccess();
    } catch {
      toast.error("Failed to add provider");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 p-6 bg-[#111113] border border-[#27272A] rounded-lg"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[#FAFAFA] font-semibold text-sm">Add Custom Provider</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-[#71717A] hover:text-[#A1A1AA] text-sm transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Template selector */}
      <ProviderTemplates selected={selectedTemplate} onSelect={handleTemplateSelect} />

      {/* Divider */}
      <div className="border-t border-[#1F1F23]" />

      {/* Form fields */}
      <div className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wide text-[#71717A]">
            Provider Name *
          </label>
          <input
            {...register("name")}
            placeholder="e.g. HDFC FinSight v2"
            className="bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-violet-500/50"
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
        </div>

        {/* Base URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wide text-[#71717A]">Base URL *</label>
          <input
            {...register("baseUrl", { onChange: handleFieldChange })}
            placeholder="https://your-endpoint/v1"
            className="bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder:text-[#52525B] font-mono focus:outline-none focus:border-violet-500/50"
          />
          {errors.baseUrl && (
            <p className="text-red-500 text-xs">{errors.baseUrl.message}</p>
          )}
        </div>

        {/* Model ID */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wide text-[#71717A]">Model ID *</label>
          <input
            {...register("modelId", { onChange: handleFieldChange })}
            placeholder="e.g. llama3 or your-finetune-v2"
            className="bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder:text-[#52525B] font-mono focus:outline-none focus:border-violet-500/50"
          />
          {errors.modelId && (
            <p className="text-red-500 text-xs">{errors.modelId.message}</p>
          )}
        </div>

        {/* API Key (optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wide text-[#71717A]">
            API Key
            <span className="ml-1 normal-case text-[#52525B]">(optional)</span>
          </label>
          <input
            {...register("apiKey", { onChange: handleFieldChange })}
            type="password"
            placeholder="sk-..."
            className="bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder:text-[#52525B] font-mono focus:outline-none focus:border-violet-500/50"
          />
        </div>

        {/* Description (optional) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wide text-[#71717A]">
            Description
            <span className="ml-1 normal-case text-[#52525B]">(optional)</span>
          </label>
          <input
            {...register("description")}
            placeholder="e.g. Fine-tuned on Q1-Q4 2024 loan data"
            className="bg-[#18181B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none focus:border-violet-500/50"
          />
        </div>
      </div>

      {/* Connection test */}
      <div className="flex flex-col gap-2 p-4 bg-[#18181B] rounded-md border border-[#1F1F23]">
        <p className="text-xs text-[#71717A]">Test connection before saving</p>
        <ConnectionTestButton
          baseUrl={baseUrl}
          modelId={modelId}
          apiKey={apiKey}
          onSuccess={() => setConnectionPassed(true)}
          disabled={!baseUrl || !modelId}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!connectionPassed || createProvider.isPending}
          className="px-4 py-2 rounded-md text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {createProvider.isPending ? "Saving..." : "Save Provider"}
        </button>
        {!connectionPassed && (
          <p className="text-xs text-[#71717A]">Test connection first to enable save</p>
        )}
      </div>
    </form>
  );
}
