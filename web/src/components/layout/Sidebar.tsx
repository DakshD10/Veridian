"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FlaskConical,
  History,
  Rocket,
  Bot
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Eval Suites", href: "/suites", icon: FlaskConical },
  { name: "Run History", href: "/runs", icon: History },
  { name: "Deployments", href: "/deployments", icon: Rocket },
  { name: "Agent", href: "/agent", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-52 h-full bg-linear-to-b from-[#09090B] to-[#0D0D10] border-r border-[#1F1F23]">

      {/* Nav Items */}
      <div className="flex-1 py-4 px-2 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // Dashboard gets an exact match, others get startsWith match
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 h-9 px-3 rounded-md font-medium text-sm transition-colors border-l-2 ${
                isActive
                  ? "bg-violet-500/12 border-violet-500 text-[#FAFAFA]"
                  : "border-transparent text-[#71717A] hover:bg-[#18181B] hover:text-[#A1A1AA]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-violet-500" : "text-[#71717A]"}`} />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 mt-auto flex flex-col gap-1">
        <span className="text-[11px] font-sans text-[#3F3F46]">LunaticBytes · TechnoTarang 2026</span>
        <span className="text-[11px] font-mono text-[#3F3F46]">v0.1.0</span>
      </div>
    </div>
  );
}
