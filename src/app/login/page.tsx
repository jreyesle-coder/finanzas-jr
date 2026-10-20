import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-emerald-400">
            JR
          </div>
          <h1 className="text-2xl font-semibold">Finanzas JR</h1>
          <p className="mt-1 text-sm text-slate-500">Tablero de salida de deuda</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
