import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <main className="mx-auto w-full max-w-2xl flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
