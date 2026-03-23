"use client";

import { useDeployments } from "@/hooks/useDeployments";
import { DeploymentCard } from "@/components/deployments/DeploymentCard";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/layout/PageLayout";

export default function DeploymentsPage() {
  const { data, isLoading, isError } = useDeployments();
  const deployments = data ?? [];
  const activeCount = deployments.filter((deployment) => deployment.isActive).length;
  const pausedCount = deployments.filter((deployment) => !deployment.isActive).length;

  // Derive system status from loading/error state:
  const systemStatus = isError 
    ? { label: "System Error",   color: "#EF4444" }
    : isLoading 
    ? { label: "Checking...",    color: "#F59E0B" }
    : { label: "System Healthy", color: "#22C55E" };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading deployments...</div>;
  if (isError) return <div className="p-8 text-center text-destructive">Failed to load deployments.</div>;

  return (
    <PageLayout 
      title="Watched Deployments"
      subtitle={`${activeCount} active · ${pausedCount} paused`}
      actionButton={{ href: "/deployments/new", label: "New Deployment", icon: <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} /> }}
      stats={[
        { label: "TOTAL DEPLOYMENTS", value: deployments.length },
        { label: "ACTIVE", value: activeCount, color: "text-[#22C55E]" },
        { label: "PAUSED", value: pausedCount, color: "text-[#71717A]" },
        { label: "SYSTEM STATUS", value: systemStatus.label, color: systemStatus.color === "#EF4444" ? "text-red-400" : systemStatus.color === "#F59E0B" ? "text-amber-400" : "text-green-400" }
      ]}
    >
      {/* Main Content */}
      {deployments.length > 0 ? (
        <div className="flex flex-col w-full">
          {deployments.map((deployment, index) => (
            <DeploymentCard key={deployment.id} deployment={deployment} index={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 w-full">
          <Link
            href="/deployments/new"
            className="bg-transparent border border-solid border-[#27272A] rounded-lg p-6 h-[200px] flex flex-col items-center justify-center gap-3 group cursor-pointer hover:border-[#3F3F46] hover:bg-[#111113]/50 transition-colors"
          >
            <Plus className="w-[20px] h-[20px] text-[#3F3F46] group-hover:text-[#A1A1AA] transition-colors" />
            <span className="text-[#52525B] text-[13px] font-medium font-sans group-hover:text-[#A1A1AA] transition-colors">Add Deployment</span>
          </Link>
        </div>
      )}
    </PageLayout>
  );
}
