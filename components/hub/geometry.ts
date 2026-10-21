// Fig 1 · Muelle BACO. Geometría estática de la figura isométrica (skill anatomy):
// un camión del productor descarga en un muelle, la cinta pasa bajo el lector BACO,
// una plataforma giratoria orienta cada caja a su rampa y una furgoneta de hostelero
// la recoge. Todo se calcula una vez en el servidor; live.tsx solo mueve piezas.
import * as k from "../iso/iso-kit";
import * as G from "../iso/lathe.mjs";
import type { Plan, Point3, Projection } from "../iso/iso-kit";

export const WIDTH = 600;
export const HEIGHT = 430;

// --- mundo (1 unidad ≈ 1 px; x a lo largo del flujo, y hacia el espectador, z arriba) ---
const GROUND = -14;
const DOCK: Plan = { x: -60, y: -48, w: 232, d: 96, r: 6 };
const DOCK_TOP = 0;
const DOCK_H = 10;
export const RIDE = 5; // altura a la que viajan las cajas (cinta, plataforma y rampas)
export const SCAN_X = 0;
export const TABLE: [number, number] = [92, 0];
const TABLE_R = 15;
export const LANE_Y = [-30, 0, 30];
export const LANE_END_X = 168;
export const VAN_X = 177;
const TRUCK_REAR = -64;

export const P: Projection = k.fitProjection(
  [
    ...k.boxCorners(DOCK, GROUND, DOCK_TOP),
    [-170, -22, GROUND],
    [-170, 22, 36],
    [-140, 22, 36],
    [0, 20, 44],
    [240, 46, GROUND],
    [240, -46, 22],
  ],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 40 },
);

// Proyección lineal para el cliente: iso(p) = o + x·ex + y·ey + z·ez.
const o = k.iso([0, 0, 0], P);
const axis = (v: Point3) => {
  const [sx, sy] = k.iso(v, P);
  return [sx - o[0], sy - o[1]] as [number, number];
};
export const BASIS = { o, ex: axis([1, 0, 0]), ey: axis([0, 1, 0]), ez: axis([0, 0, 1]) };

const S = (paths: k.SolidPaths, style?: Parameters<typeof k.solidSvg>[1]) => k.solidSvg(paths, style);
const L = (d: string, style?: Parameters<typeof k.lineSvg>[1]) => k.lineSvg(d, style);
const D = (points: [number, number][], style?: Parameters<typeof k.dotsSvg>[1]) => k.dotsSvg(points, style);
const at = (p: Point3) => k.iso(p, P);
const depth = (x: number, y: number) => k.depthOf([x, y, 0], P);
const byDepth = <T extends [number, number]>(pts: T[]) => [...pts].sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));
const poly = (pts: Point3[]) => k.pathOf(pts.map(at), true);

// Rueda: disco de eje y apoyado en el suelo.
function wheel(x: number, y: number, r: number, width: number) {
  const F = G.frameAlong([x, y, GROUND + r], [0, 1, 0]);
  return [
    S(G.disc(0, width, r, F, P), { tone: "lo" }),
    S(G.disc(width, width + 0.5, r * 0.46, F, P), { tone: "mid" }),
    L(G.circleOf(F, width + 0.5, r * 0.3, P), { tone: "lo" }),
    D([at([x, y + width + 0.5, GROUND + r])], { size: 0.5 }),
  ].join("");
}

// Contorno cerrado en una cara vertical y = cte (ventanas, ranuras).
const sideRect = (y: number, x0: number, x1: number, z0: number, z1: number) =>
  poly([
    [x0, y, z0],
    [x1, y, z0],
    [x1, y, z1],
    [x0, y, z1],
  ]);
// Y en una cara x = cte.
const endRect = (x: number, y0: number, y1: number, z0: number, z1: number) =>
  poly([
    [x, y0, z0],
    [x, y1, z0],
    [x, y1, z1],
    [x, y0, z1],
  ]);

// --- camión del productor ---------------------------------------------------------------
function truck() {
  const out: string[] = [];
  const box: Plan = { x: -138, y: -21, w: TRUCK_REAR + 138, d: 42, r: 2 };
  const cab: Plan = { x: -168, y: -20, w: 28, d: 40, r: 4 };
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: -170, y: -24, w: 108, d: 48, r: 6 }, GROUND, 0.1, P)}"/>`);
  out.push(S(k.slabOf({ x: -166, y: -14, w: 100, d: 28, r: 1 }, -10, 6, P, 3), { tone: "lo" }));
  // puerta lejana plegada contra el costado
  out.push(S(k.slabOf({ x: TRUCK_REAR - 20, y: -22.4, w: 20, d: 1.2, r: 0.3 }, -2, 36, P, 2), { tone: "mid", crease: "none" }));
  // cabina
  out.push(S(k.slabOf(cab, -6, 30, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(cab, 6, P, 6), { tone: "faint" }) }));
  out.push(L(sideRect(20, -163, -148, 10, 20), { tone: "lo" }));
  out.push(L(sideRect(20, -146, -142, -2, 20), { tone: "faint" }));
  out.push(S(k.slabOf({ x: -162, y: -17, w: 20, d: 34, r: 3 }, 24, 6, P, 4, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -160, y: 20, w: 8, d: 3, r: 0.6 }, -6, 2, P, 2), { tone: "lo" }));
  // caja de carga
  const ribs = [-128, -118, -108, -98, -88, -78].map((x) => k.segment([x, 21, -4], [x, 21, 36], P)).join("");
  out.push(
    S(k.slabOf(box, -4, 40, P, 3, 0.8), {
      tone: "mid",
      inner: L(k.sideSeam(box, 0, P, 3), { tone: "faint" }) + L(k.sideSeam(box, 32, P, 3), { tone: "faint" }) + L(ribs, { tone: "faint" }),
    }),
  );
  // hueco trasero abierto con carga dentro
  out.push(`<path class="hub-cavity" d="${endRect(TRUCK_REAR, -17, 17, 1, 33)}"/>`);
  for (const [y0, z0, z1] of [
    [-15, 1, 13],
    [-2, 1, 13],
    [-15, 13, 25],
    [6, 1, 11],
  ] as const) {
    out.push(`<path class="hub-cavity-crate" d="${endRect(TRUCK_REAR, y0, y0 + 11, z0, z1)}"/>`);
  }
  out.push(L(endRect(TRUCK_REAR, -17, 17, 1, 33), { tone: "lo" }));
  // puerta cercana plegada, con su manilla y bisagras
  out.push(S(k.slabOf({ x: TRUCK_REAR - 20, y: 21.2, w: 20, d: 1.2, r: 0.3 }, -2, 36, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: TRUCK_REAR - 12, y: 22.4, w: 2, d: 1, r: 0.3 }, 8, 16, P, 2), { tone: "mid", crease: "none" }));
  out.push(D([4, 16, 28].map((z) => at([TRUCK_REAR - 0.6, 22.4, z])), { size: 0.45 }));
  // retrovisor y ruedas
  out.push(S(k.slabOf({ x: -158, y: 20, w: 2, d: 4, r: 0.5 }, 14, 6, P, 2), { tone: "mid" }));
  for (const x of [-156, -100, -84]) out.push(wheel(x, 21.6, 7, 4));
  return out.join("");
}

// --- muelle ------------------------------------------------------------------------------
function dock() {
  const out: string[] = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(DOCK, GROUND, DOCK_H, P)}"/>`);
  // topes de goma del lado del camión (detrás del muelle)
  for (const y of [-22, 14]) out.push(S(k.slabOf({ x: -64, y, w: 4, d: 8, r: 1 }, -8, 7, P, 2), { tone: "lo" }));
  const feet = [...k.corners(DOCK, 16), [DOCK.x + DOCK.w / 2, DOCK.y + 16], [DOCK.x + DOCK.w / 2, DOCK.y + DOCK.d - 16]] as [number, number][];
  for (const [x, y] of byDepth(feet)) {
    out.push(S(k.cylinder(x, y, 6, GROUND, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 4.6, GROUND + 1.6, DOCK_TOP - DOCK_H - GROUND - 1.6, P, 24), { tone: "mid" }));
  }
  out.push(S(k.slabOf(DOCK, DOCK_TOP - DOCK_H, DOCK_H, P, 8, 1.4), { tone: "mid", inner: L(k.sideSeam(DOCK, -4, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(DOCK, 5), DOCK_TOP, P), { tone: "lo" }));
  const screws = k.corners(DOCK, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, DOCK_TOP, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, DOCK_TOP])), { size: 0.5 }));
  // regla en el borde frontal
  const strip: Plan = { x: -44, y: DOCK.y + DOCK.d - 11, w: 120, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, DOCK_TOP, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y + 0.8, DOCK_TOP + 0.6, [1.8, 3.4], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  // placa de identificación
  const plate: Plan = { x: -50, y: 20, w: 24, d: 13, r: 1.5 };
  out.push(S(k.slabOf(plate, DOCK_TOP, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(plate, 1.4), DOCK_TOP + 0.8, P, 4), { tone: "faint" }));
  out.push(
    L([16, 12, 9].map((w, i) => k.lineOnTop([plate.x + 4, plate.y + 4 + i * 2.6], [plate.x + 4 + w, plate.y + 4 + i * 2.6], DOCK_TOP + 0.8, P)).join(""), {
      tone: "lo",
      free: true,
    }),
  );
  // palés con cajas a la espera, en el fondo del muelle
  for (const px of [-8, 30]) {
    const pallet: Plan = { x: px, y: -42, w: 26, d: 20, r: 1 };
    out.push(S(k.slabOf(pallet, DOCK_TOP, 2.6, P, 2, 0.4), { tone: "lo" }));
    out.push(L([4, 10, 16].map((dy) => k.lineOnTop([pallet.x, pallet.y + dy], [pallet.x + pallet.w, pallet.y + dy], DOCK_TOP + 2.6, P)).join(""), { tone: "faint" }));
    const boxes: [number, number, number][] = [
      [px + 1, -41, 0],
      [px + 14, -41, 0],
      [px + 1, -31, 0],
      [px + 14, -31, 0],
      [px + 1, -41, 1],
    ];
    for (const [bx, by, level] of boxes) {
      const plan: Plan = { x: bx, y: by, w: 11, d: 9.4, r: 0.8 };
      const z = DOCK_TOP + 2.6 + level * 8;
      out.push(S(k.slabOf(plan, z, 8, P, 2, 0.4), { tone: "mid", inner: L(k.sideSeam(plan, z + 4, P, 2), { tone: "faint" }) }));
    }
  }
  // rampa niveladora entre camión y muelle
  out.push(S(k.slabOf({ x: -66, y: -14, w: 14, d: 28, r: 1 }, DOCK_TOP, 0.8, P, 3), { tone: "lo" }));
  out.push(L([-12, -6, 0, 6, 12].map((y) => k.lineOnTop([-65, y], [-53, y], DOCK_TOP + 0.8, P)).join(""), { tone: "faint" }));
  return out.join("");
}

// --- cinta transportadora ----------------------------------------------------------------
const BELT_FROM = -54;
const BELT_TO = 76;
function beltBack() {
  const out: string[] = [];
  out.push(S(k.slabOf({ x: BELT_FROM, y: -11, w: BELT_TO - BELT_FROM, d: 22, r: 3 }, DOCK_TOP, 3, P, 4, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: BELT_FROM + 1, y: -9, w: BELT_TO - BELT_FROM - 2, d: 18, r: 2 }, 3, RIDE - 3, P, 4), { tone: "lo", crease: "none" }));
  const rollers: string[] = [];
  for (let x = BELT_FROM + 5; x < BELT_TO - 3; x += 5) rollers.push(k.lineOnTop([x, -9], [x, 9], RIDE, P));
  out.push(L(rollers.join(""), { tone: "faint" }));
  out.push(S(k.slabOf({ x: BELT_FROM + 2, y: -11, w: BELT_TO - BELT_FROM - 4, d: 1.4, r: 0.5 }, 3, 4.5, P, 2), { tone: "mid", crease: "none" }));
  // lector: pie y poste del fondo
  out.push(S(k.slabOf({ x: SCAN_X - 6, y: -22, w: 12, d: 8, r: 1.5 }, DOCK_TOP, 1.5, P, 3), { tone: "lo" }));
  out.push(D([at([SCAN_X - 3.5, -18, 1.5]), at([SCAN_X + 3.5, -18, 1.5])], { size: 0.45 }));
  out.push(S(k.slabOf({ x: SCAN_X - 3, y: -20, w: 6, d: 5, r: 1 }, 1.5, 34.5, P, 3, 0.4), { tone: "mid" }));
  return out.join("");
}

function beltFront() {
  const out: string[] = [];
  out.push(S(k.slabOf({ x: BELT_FROM + 2, y: 9.6, w: BELT_TO - BELT_FROM - 4, d: 1.4, r: 0.5 }, 3, 4.5, P, 2), { tone: "mid", crease: "none" }));
  // motor de la cinta
  const motor: Plan = { x: -44, y: 11.5, w: 14, d: 7, r: 1.5 };
  out.push(S(k.slabOf(motor, DOCK_TOP, 8, P, 3, 0.5), { tone: "mid" }));
  out.push(L([2.5, 4.5].map((z) => sideRect(18.5, motor.x + 3, motor.x + 11, z, z + 0.9)).join(""), { tone: "lo" }));
  // lector: pie y poste delanteros, travesaño, cabezal y lente
  out.push(S(k.slabOf({ x: SCAN_X - 6, y: 12, w: 12, d: 8, r: 1.5 }, DOCK_TOP, 1.5, P, 3), { tone: "lo" }));
  out.push(D([at([SCAN_X - 3.5, 18, 1.5]), at([SCAN_X + 3.5, 18, 1.5])], { size: 0.45 }));
  out.push(S(k.slabOf({ x: SCAN_X - 3, y: 15, w: 6, d: 5, r: 1 }, 1.5, 34.5, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: SCAN_X - 6, y: -6, w: 12, d: 12, r: 2 }, 30, 6, P, 4, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(SCAN_X, 0, 3, 28.4, 1.6, P, 24), { tone: "hi", className: "hub-lens" }));
  const bar: Plan = { x: SCAN_X - 5, y: -21, w: 10, d: 42, r: 1.5 };
  out.push(S(k.slabOf(bar, 36, 6, P, 3, 0.6), { tone: "mid" }));
  out.push(D([at([SCAN_X - 2.5, -18, 42]), at([SCAN_X + 2.5, -18, 42])], { size: 0.45 }));
  out.push(k.faceTextSvg(k.sideMatrix([SCAN_X - 3.4, 21], 40.4, P, "left"), "baco", { size: 3, tone: "mid" }));
  out.push(S(k.cylinder(SCAN_X, 15, 1.4, 42, 1.4, P, 16), { tone: "mid", className: "hub-status" }));
  return out.join("");
}

// --- plataforma giratoria y rampas --------------------------------------------------------
type LaneGeo = { from: [number, number]; to: [number, number]; dir: [number, number]; angle: number };
export const LANES: LaneGeo[] = LANE_Y.map((y) => {
  const dx = LANE_END_X - TABLE[0];
  const dy = y - TABLE[1];
  const len = Math.hypot(dx, dy);
  const dir: [number, number] = [dx / len, dy / len];
  return { from: [TABLE[0] + dir[0] * (TABLE_R + 1), TABLE[1] + dir[1] * (TABLE_R + 1)], to: [LANE_END_X, y], dir, angle: Math.atan2(dy, dx) };
});

function lanes() {
  const out: string[] = [];
  out.push(S(k.slabOf({ x: BELT_TO - 1, y: -8, w: TABLE[0] - TABLE_R - BELT_TO + 1.6, d: 16, r: 0.8 }, DOCK_TOP, RIDE, P, 2), { tone: "mid" }));
  // rampas, de la más lejana a la más cercana
  for (const lane of [...LANES].sort((a, b) => depth(...a.to) - depth(...b.to))) {
    const [nx, ny] = [-lane.dir[1], lane.dir[0]];
    const half = 8.5;
    const ringPts: [number, number][] = [
      [lane.from[0] + nx * half, lane.from[1] + ny * half],
      [lane.to[0] + nx * half, lane.to[1] + ny * half],
      [lane.to[0] - nx * half, lane.to[1] - ny * half],
      [lane.from[0] - nx * half, lane.from[1] - ny * half],
    ];
    out.push(S(k.extrude(ringPts, DOCK_TOP, RIDE, P), { tone: "mid" }));
    const length = Math.hypot(lane.to[0] - lane.from[0], lane.to[1] - lane.from[1]);
    const rollers: string[] = [];
    for (let s = 5; s < length - 2; s += 5) {
      const cx = lane.from[0] + lane.dir[0] * s;
      const cy = lane.from[1] + lane.dir[1] * s;
      rollers.push(k.lineOnTop([cx + nx * half, cy + ny * half], [cx - nx * half, cy - ny * half], RIDE, P));
    }
    out.push(L(rollers.join(""), { tone: "faint" }));
  }
  // plataforma
  const [cx, cy] = TABLE;
  out.push(S(k.cylinder(cx, cy, TABLE_R, DOCK_TOP, 3, P, 64, 0.6), { tone: "mid" }));
  out.push(S(k.cylinder(cx, cy, TABLE_R - 2, 3, RIDE - 3, P, 64, 0.5), { tone: "hi", crease: "lo" }));
  const ticks = k.radialTicks(cx, cy, TABLE_R - 3, 48, 4, RIDE, [1, 2.2], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(k.ring(cx, cy, 2, RIDE, P, 20), { tone: "mid" }));
  // topes de goma en el borde de las furgonetas
  for (const y of LANE_Y) {
    for (const dy of [-9, 9]) out.push(S(k.slabOf({ x: DOCK.x + DOCK.w, y: y + dy - 2, w: 3.5, d: 4, r: 1 }, -8, 7, P, 2), { tone: "lo" }));
  }
  return out.join("");
}

// Puntero de la plataforma hacia la rampa elegida (se recalcula en el cliente).
export const POINTER = { cx: TABLE[0], cy: TABLE[1], r0: 2, r1: TABLE_R - 4.5, z: RIDE + 0.05 };

// --- caja (se construye en el origen y se mueve con translate) -------------------------
const CRATE: Plan = { x: -6, y: -6, w: 12, d: 12, r: 1 };
export const CRATE_H = 9;
export const CRATE_SVG = (() => {
  const seam = L(k.sideSeam(CRATE, CRATE_H / 2, P, 3), { tone: "faint" });
  const slot = L(sideRect(6, -2.5, 2.5, 6, 7.2), { tone: "lo" });
  return [
    S(k.slabOf(CRATE, 0, CRATE_H, P, 3, 0.5), { tone: "hi", crease: "lo", inner: seam + slot }),
    L(k.planOutline(k.insetPlan(CRATE, 1.6), CRATE_H, P, 3), { tone: "faint" }),
  ].join("");
})();

// Haz del lector: dos líneas de la lente a la tapa de la caja.
export const BEAM = {
  from: [
    [SCAN_X - 2, 0, 28.4],
    [SCAN_X + 2, 0, 28.4],
  ] as Point3[],
  to: [
    [SCAN_X - 4.5, 0, RIDE + CRATE_H],
    [SCAN_X + 4.5, 0, RIDE + CRATE_H],
  ] as Point3[],
};

// --- furgonetas de hostelería ------------------------------------------------------------
function van(y: number) {
  const out: string[] = [];
  const body: Plan = { x: VAN_X, y: y - 12, w: 46, d: 24, r: 3 };
  const cab: Plan = { x: VAN_X + 46, y: y - 12, w: 15, d: 24, r: 5 };
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: VAN_X, y: y - 13, w: 62, d: 26, r: 5 }, GROUND, 0.1, P)}"/>`);
  out.push(S(k.slabOf({ x: VAN_X - 1.5, y: y - 11, w: 3, d: 22, r: 0.6 }, -7, 4, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf(body, -7, 29, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(body, 6, P, 3), { tone: "faint" }) }));
  out.push(S(k.slabOf({ x: VAN_X + 14, y: y - 6, w: 16, d: 12, r: 1.5 }, 22, 2, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf(cab, -7, 22, P, 5, 0.8), { tone: "mid" }));
  out.push(L(endRect(VAN_X + 61, y - 9, y + 9, 5, 12), { tone: "lo" }));
  out.push(L(sideRect(y + 12, VAN_X + 49, VAN_X + 58, 5, 12), { tone: "lo" }));
  out.push(L(sideRect(y + 12, VAN_X + 47.5, VAN_X + 48.5, -4, 13), { tone: "faint" }));
  for (const x of [VAN_X + 10, VAN_X + 52]) out.push(wheel(x, y + 12, 6, 3));
  return out.join("");
}
export const VANS_SVG = LANE_Y.map((y) => van(y));

export const LAYERS = {
  truck: truck(),
  dock: dock(),
  beltBack: beltBack(),
  lanes: lanes(),
  beltFront: beltFront(),
};

export const LABEL =
  "Un muelle de carga en isométrico. A la izquierda, el camión de un productor con la puerta abierta descarga cajas sobre una cinta transportadora. La cinta pasa bajo el lector BACO, que lee cada caja, y llega a una plataforma giratoria que la orienta hacia una de tres rampas. Al final de cada rampa espera la furgoneta de un hostelero, que recibe la caja y se va.";
