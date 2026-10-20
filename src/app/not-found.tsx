import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-4xl font-semibold">404</p>
      <p className="text-slate-600">Esta página no existe.</p>
      <Link href="/" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
        Ir al tablero
      </Link>
    </main>
  );
}
