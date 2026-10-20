"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Inicio", icon: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/flujo", label: "Flujo", icon: "M4 5h16v15H4zM4 9h16M9 3v4M15 3v4" },
  { href: "/registrar", label: "Registrar", icon: "M12 5v14M5 12h14", destacado: true },
  { href: "/deudas", label: "Deudas", icon: "M3 7h18v12H3zM3 11h18M7 15h4" },
  { href: "/mas", label: "Más", icon: "M5 12h.01M12 12h.01M19 12h.01" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((it) => {
          const activo = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <li key={it.href} className="flex-1">
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${activo ? "text-slate-900" : "text-slate-400"}`}
              >
                <span
                  className={
                    it.destacado
                      ? "flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow"
                      : "flex h-6 w-6 items-center justify-center"
                  }
                >
                  <svg viewBox="0 0 24 24" className={it.destacado ? "h-6 w-6" : "h-6 w-6"} fill="none" stroke="currentColor" strokeWidth={it.label === "Más" ? 3.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d={it.icon} />
                  </svg>
                </span>
                {!it.destacado && it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
