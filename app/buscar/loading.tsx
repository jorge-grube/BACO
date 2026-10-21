// Mientras llega la búsqueda: esqueleto con la forma de los resultados (la espera se nota menos que con una pantalla en blanco).
export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-5 pt-8 md:px-8 xl:px-12" aria-busy="true" aria-live="polite">
      <p className="sr-only">Buscando…</p>
      <div className="skeleton h-12 max-w-3xl rounded-[12px]" />
      <div className="mt-3 flex gap-2">
        {[88, 64, 72, 96].map((w) => (
          <div key={w} className="skeleton h-10 rounded-full" style={{ width: w }} />
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <div className="hidden space-y-2 lg:block">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-7 rounded-[8px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-md border border-line">
              <div className="skeleton aspect-[4/3]" />
              <div className="space-y-2 p-4">
                <div className="skeleton h-4 w-4/5 rounded" />
                <div className="skeleton h-3.5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
