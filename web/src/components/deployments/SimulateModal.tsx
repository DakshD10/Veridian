import { useEffect } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function SimulateModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const router = useRouter();
  
  // Lock scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
       
       <div className="relative bg-[#09090B] border border-[#1F1F23] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
             <h2 className="font-sans text-[18px] font-bold text-[#FAFAFA] tracking-tight">Simulate Version Change</h2>
             <button onClick={onClose} className="text-[#52525B] hover:text-[#FAFAFA] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
             </button>
          </div>
          <div className="flex flex-col gap-4 mb-8">
             <p className="font-sans text-[14px] text-[#A1A1AA] leading-relaxed">
               Select a candidate model to simulate against the active <strong className="text-[#FAFAFA]">Healthcare-Production-v4</strong> suite dataset. This will trigger a complete shadow background run without affecting production thresholds.
             </p>
             <div className="flex flex-col gap-2">
                <label className="font-sans text-[12px] font-medium text-[#71717A]">Target Model ID</label>
                <div className="w-full bg-[#111113] border border-[#27272A] rounded-lg px-4 py-2 font-mono text-[13px] text-[#FAFAFA]">
                   llama3-120b-instruct-rc1
                </div>
             </div>
          </div>
          <div className="flex justify-end gap-3 mt-auto w-full">
             <button onClick={onClose} className="px-4 py-2 rounded-lg font-sans text-[13px] font-medium text-[#FAFAFA] bg-[#18181B] border border-[#27272A] hover:bg-[#27272A] transition-colors cursor-pointer">
                Cancel
             </button>
             <button 
               onClick={() => {
                 onClose();
                 router.push('/agent?agentRunId=123');
               }} 
               className="px-4 py-2 rounded-lg font-sans text-[13px] font-medium text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors cursor-pointer"
             >
                Trigger Agent →
             </button>
          </div>
       </div>
    </div>
  );
}
