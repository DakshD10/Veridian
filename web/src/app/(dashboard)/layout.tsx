"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { CursorGlowTrail } from "@/components/global/CursorGlowTrail";
import { NoiseOverlay } from "@/components/global/NoiseOverlay";
import { PageTransition } from "@/components/global/PageTransition";
import { AmbientBackground } from "@/components/vfx/AmbientBackground";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#09090B]">
      <AmbientBackground />
      <CursorGlowTrail />
      <NoiseOverlay />
      <Sidebar />
      <main className="flex-1 w-full relative">
        <div 
          ref={scrollContainerRef}
          id="scroll-container"
          className="h-[calc(100vh-56px)] overflow-y-auto scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(139,92,246,0.3) transparent'
          }}
        >
          <style jsx>{`
            #scroll-container::-webkit-scrollbar {
              width: 4px;
            }
            #scroll-container::-webkit-scrollbar-track {
              background: transparent;
            }
            #scroll-container::-webkit-scrollbar-thumb {
              background: rgba(139,92,246,0.3);
              border-radius: 2px;
            }
          `}</style>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <PageTransition>
                {children}
              </PageTransition>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
