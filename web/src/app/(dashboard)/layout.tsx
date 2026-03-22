import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#09090B]">
      <Sidebar />
      <main className="flex-1 w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
