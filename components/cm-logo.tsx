import clsx from "clsx";

// Logotipo de la Comunidad de Madrid (recreado en SVG): cuadrado rojo con siete
// estrellas y el nombre. Se usa para atribuir la fuente de los datos del catálogo.
// Si Aplus facilita el archivo oficial, sustituir por public/comunidad-madrid.svg.
function star(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

const STARS = [
  [9.5, 22.5],
  [17, 22.5],
  [24.5, 22.5],
  [32, 22.5],
  [13.25, 30],
  [20.75, 30],
  [28.25, 30],
];

export function CMLogo({ className, tone = "ink" }: { className?: string; tone?: "ink" | "white" }) {
  return (
    <svg viewBox="0 0 168 42" className={clsx("h-8 w-auto", className)} role="img" aria-label="Comunidad de Madrid">
      <rect x="0" y="0" width="42" height="42" fill="#E3262B" />
      {STARS.map(([x, y], i) => (
        <polygon key={i} points={star(x, y, 3.3)} fill="#fff" />
      ))}
      <text x="50" y="18" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="18.5" fill={tone === "white" ? "#fff" : "#141816"}>
        Comunidad
      </text>
      <text x="50" y="38" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="18.5" fill={tone === "white" ? "#fff" : "#141816"}>
        de Madrid
      </text>
    </svg>
  );
}
