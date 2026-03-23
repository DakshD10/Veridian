"use client";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":    "Dashboard",
  "/suites":       "Eval Suites",
  "/runs":         "Run History",
  "/deployments":  "Deployments",
  "/agent":        "Agent",
};

export function Header() {
  const pathname = usePathname();
  const segment = "/" + (pathname.split("/")[1] ?? "");
  const title = PAGE_TITLES[segment] ?? "Veridian";

  return (
    <div className="h-14 border-b border-[#1F1F23] flex items-center px-6">
      <span className="text-[#FAFAFA] font-medium text-sm">{title}</span>
    </div>
  );
}