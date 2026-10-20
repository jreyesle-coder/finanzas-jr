import Link from "next/link";
import { requerirSesion } from "@/lib/auth";
import { calcularAvisos } from "@/lib/avisos";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requerirSesion();
  const avisos = await calcularAvisos();
  const pendientes = avisos.filter((a) => a.nivel !== "logro").length;
  return (
    <>
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-emerald-400">JR</span>
            Finanzas
          </Link>
          <Link href="/avisos" className="relative rounded-full p-2 text-slate-600" aria-label={`Avisos${pendientes ? `: ${pendientes} pendientes` : ""}`}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {pendientes > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{pendientes}</span>
            )}
          </Link>
        </div>
      </div>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}
