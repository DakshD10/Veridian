"use client";

import { useDeployments } from "@/hooks/useDeployments";
import { DeploymentCard } from "@/components/deployments/DeploymentCard";
import { Plus } from "lucide-react";
import Link from "next/link";

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
    <div className="flex flex-col min-h-screen bg-[#09090B] w-full p-8 relative overflow-hidden">
      
      {/* Visual Glow Elements overlay generic arrays */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-900/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-5%] left-[10%] w-[300px] h-[300px] bg-green-900/5 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

      {/* TopAppBar Shell */}
      <div className="flex justify-between items-center mb-1 w-full max-w-[1232px]">
        <h1 className="text-[20px] font-bold tracking-tight text-[#FAFAFA] font-sans">Watched Deployments</h1>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-2.5 py-1 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-[4px]">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: systemStatus.color }}></div>
              <span 
                className="text-[12px] font-mono"
                style={{ color: systemStatus.color }}
              >
                ● {systemStatus.label}
              </span>
           </div>
           <Link 
             href="/deployments/new"
             className="px-4 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[14px] font-medium rounded-[6px] transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer"
           >
              <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
              New Deployment
           </Link>
        </div>
      </div>
      
      <div className="mb-8 w-full max-w-[1232px]">
        <p className="text-[14px] text-[#71717A] font-mono">{`${activeCount} active · ${pausedCount} paused`}</p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col w-full z-10 w-full max-w-[1232px]">
        {deployments.length > 0 ? (
          deployments.map((deployment) => (
            <DeploymentCard key={deployment.id} deployment={deployment} />
          ))
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
      </div>
    </div>
  );
}
