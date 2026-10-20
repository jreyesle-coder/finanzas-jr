"use client";

export default function ErrorApp({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
      <p className="font-semibold text-red-800">Algo salió mal.</p>
      <p className="mt-1 text-sm text-red-700">No se perdió ningún dato. Intenta de nuevo.</p>
      <button onClick={reset} className="mt-3 rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white">
        Reintentar
      </button>
    </div>
  );
}
