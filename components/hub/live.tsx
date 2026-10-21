"use client";

import { useEffect, useRef } from "react";

export type HubMatch = { product: string; producer: string; dest: number; score: number };

type Basis = { o: [number, number]; ex: [number, number]; ey: [number, number]; ez: [number, number] };
type Lane = { from: [number, number]; to: [number, number]; dir: [number, number]; angle: number };

export type HubProps = {
  width: number;
  height: number;
  label: string;
  layers: { truck: string; dock: string; beltBack: string; lanes: string; beltFront: string };
  crate: string;
  vans: string[];
  basis: Basis;
  lanes: Lane[];
  table: [number, number];
  pointer: { cx: number; cy: number; r0: number; r1: number; z: number };
  beam: { from: [number, number, number][]; to: [number, number, number][] };
  ride: number;
  scanX: number;
  matches: HubMatch[];
  dests: string[];
  restText: string;
  bare?: boolean;
};

const SPEED = 34; // unidades por segundo sobre la cinta
const SPAWN_X = -58;

type Crate = {
  el: SVGGElement;
  match: HubMatch;
  lane: number;
  // tramos: 0 cinta → lector, 1 lectura, 2 lector → plataforma, 3 giro, 4 rampa, 5 entrada en furgoneta
  stage: number;
  t: number;
  x: number;
  y: number;
  alpha: number;
};

type Van = { state: "parked" | "leaving" | "away" | "arriving"; t: number; dx: number };

export function HubLive(props: HubProps) {
  const root = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const slotBelt = useRef<SVGGElement>(null);
  const slotOut = useRef<SVGGElement>(null);
  const pointerRef = useRef<SVGPathElement>(null);
  const beamRef = useRef<SVGGElement>(null);
  const vanRefs = useRef<(SVGGElement | null)[]>([]);
  const readoutRef = useRef<HTMLSpanElement>(null);

  const { basis, lanes, pointer } = props;
  const project = (x: number, y: number, z: number): [number, number] => [
    basis.o[0] + x * basis.ex[0] + y * basis.ey[0] + z * basis.ez[0],
    basis.o[1] + x * basis.ex[1] + y * basis.ey[1] + z * basis.ez[1],
  ];
  const pointerD = (angle: number) => {
    const a = project(pointer.cx + Math.cos(angle) * pointer.r0, pointer.cy + Math.sin(angle) * pointer.r0, pointer.z);
    const b = project(pointer.cx + Math.cos(angle) * pointer.r1, pointer.cy + Math.sin(angle) * pointer.r1, pointer.z);
    return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  };
  const restAngle = lanes[0].angle;
  const restCrate = project(props.scanX, 0, props.ride);
  const beamD = (dx: number) =>
    props.beam.from
      .map((f, i) => {
        const a = project(...f);
        const b = project(props.beam.to[i][0] + dx, props.beam.to[i][1], props.beam.to[i][2]);
        return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
      })
      .join("");

  useEffect(() => {
    const svg = svgRef.current!;
    const belt = slotBelt.current!;
    const out = slotOut.current!;
    const pointerEl = pointerRef.current!;
    const beam = beamRef.current!;
    const readout = readoutRef.current;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    svg.querySelector("[data-rest-crate]")?.remove();

    const vans: Van[] = props.vans.map(() => ({ state: "parked", t: 0, dx: 0 }));
    const crates: Crate[] = [];
    let angle = restAngle;
    let cursor = 0;
    let wanted: number | null = null;
    let frame = 0;
    let last = 0;
    let visible = false;
    let text = "";

    const say = (next: string) => {
      if (next !== text) {
        text = next;
        if (readout) readout.textContent = next;
      }
    };

    const nextMatch = (): HubMatch => {
      if (wanted !== null) {
        const pick = props.matches.find((m, i) => m.dest === wanted && i !== cursor % props.matches.length);
        wanted = null;
        if (pick) return pick;
      }
      const m = props.matches[cursor % props.matches.length];
      cursor++;
      return m;
    };

    const spawn = () => {
      const match = nextMatch();
      const el = document.createElementNS("http://www.w3.org/2000/svg", "g");
      el.innerHTML = props.crate;
      el.setAttribute("data-part", "crate");
      belt.appendChild(el);
      const c: Crate = { el, match, lane: match.dest, stage: 0, t: 0, x: SPAWN_X, y: 0, alpha: 0 };
      crates.push(c);
      say(`Descargando · ${match.product}`);
    };

    const place = (c: Crate) => {
      const [sx, sy] = project(c.x, c.y, props.ride);
      const [ox, oy] = project(0, 0, 0);
      c.el.setAttribute("transform", `translate(${(sx - ox).toFixed(2)} ${(sy - oy).toFixed(2)})`);
      c.el.style.opacity = c.alpha < 1 ? c.alpha.toFixed(3) : "";
    };

    const setLit = (target: Crate | null) => {
      for (const c of crates) {
        const solid = c.el.querySelector(".iso-solid");
        if (!solid) continue;
        if (c === target) solid.setAttribute("data-lit", "");
        else solid.removeAttribute("data-lit");
      }
    };

    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

    function step(dt: number) {
      // furgonetas
      vans.forEach((v, i) => {
        v.t += dt;
        if (v.state === "leaving") {
          v.dx = 170 * ease(Math.min(1, v.t / 1.7));
          if (v.t >= 1.7) Object.assign(v, { state: "away", t: 0 });
        } else if (v.state === "away") {
          if (v.t >= 0.9) Object.assign(v, { state: "arriving", t: 0 });
        } else if (v.state === "arriving") {
          v.dx = 170 * (1 - ease(Math.min(1, v.t / 2)));
          if (v.t >= 2) Object.assign(v, { state: "parked", t: 0, dx: 0 });
        }
        const el = vanRefs.current[i];
        if (el) {
          const [sx, sy] = project(v.dx, 0, 0);
          const [ox, oy] = project(0, 0, 0);
          el.setAttribute("transform", v.dx ? `translate(${(sx - ox).toFixed(2)} ${(sy - oy).toFixed(2)})` : "");
        }
      });

      let scanning: Crate | null = null;
      let onTable: Crate | null = null;
      for (const c of [...crates]) {
        c.t += dt;
        const lane = lanes[c.lane];
        if (c.stage === 0) {
          c.alpha = Math.min(1, c.alpha + dt / 0.45);
          c.x = Math.min(props.scanX, c.x + SPEED * dt);
          if (c.x >= props.scanX) Object.assign(c, { stage: 1, t: 0 });
        } else if (c.stage === 1) {
          scanning = c;
          if (c.t > 1.1) {
            Object.assign(c, { stage: 2, t: 0 });
            say(`Leído · ${c.match.product} → ${props.dests[c.lane]}`);
          }
        } else if (c.stage === 2) {
          c.x = Math.min(props.table[0], c.x + SPEED * dt);
          if (c.x >= props.table[0] - 34 && c.el.parentNode !== out) out.appendChild(c.el);
          if (c.x >= props.table[0]) Object.assign(c, { stage: 3, t: 0 });
        } else if (c.stage === 3) {
          onTable = c;
          if (Math.abs(angle - lane.angle) < 0.01 && c.t > 0.5 && vans[c.lane].state === "parked") {
            Object.assign(c, { stage: 4, t: 0 });
            say(`${c.match.product} → ${props.dests[c.lane]} · encaje ${c.match.score}`);
          }
        } else if (c.stage === 4) {
          const total = Math.hypot(lane.to[0] - props.table[0], lane.to[1] - props.table[1]) + 10;
          const s = Math.min(total, c.t * SPEED);
          c.x = props.table[0] + lane.dir[0] * s;
          c.y = props.table[1] + lane.dir[1] * s;
          const past = s - (total - 10);
          if (past > 0) c.alpha = Math.max(0, 1 - past / 8);
          if (s >= total) {
            c.el.remove();
            crates.splice(crates.indexOf(c), 1);
            const v = vans[c.lane];
            Object.assign(v, { state: "leaving", t: -0.5 });
            continue;
          }
        }
        place(c);
      }

      // el puntero sigue a la caja que está en la plataforma
      const targetAngle = onTable ? lanes[(onTable as Crate).lane].angle : angle;
      angle += (targetAngle - angle) * (1 - Math.exp(-dt / 0.18));
      if (Math.abs(targetAngle - angle) < 0.004) angle = targetAngle;
      pointerEl.setAttribute("d", pointerD(angle));

      beam.style.opacity = scanning ? "1" : "0";
      setLit(scanning ?? crates[crates.length - 1] ?? null);

      // siguiente caja cuando la anterior ha dejado la plataforma
      const busy = crates.some((c) => c.stage <= 3);
      if (!busy) spawn();
    }

    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
      last = now;
      step(dt);
      frame = visible ? requestAnimationFrame(tick) : 0;
    };
    const run = () => {
      if (!frame && visible && !still.matches) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };

    // Movimiento reducido: una sola imagen fija con una caja bajo el lector.
    if (still.matches) {
      const match = props.matches[0];
      const el = document.createElementNS("http://www.w3.org/2000/svg", "g");
      el.innerHTML = props.crate;
      belt.appendChild(el);
      const c: Crate = { el, match, lane: match.dest, stage: 1, t: 0, x: props.scanX, y: 0, alpha: 1 };
      crates.push(c);
      place(c);
      setLit(c);
      beam.style.opacity = "1";
      say(`Leído · ${match.product} → ${props.dests[match.dest]}`);
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        run();
      },
      { rootMargin: "80px 0px" },
    );
    io.observe(root.current!);

    // Elegir hostelero: la siguiente caja será para su furgoneta.
    const choose = (lane: number) => {
      wanted = lane;
      say(`Siguiente caja para ${props.dests[lane]}`);
    };
    const onPointer = (event: Event) => {
      const part = (event.target as Element).closest("[data-van]");
      if (part) choose(Number(part.getAttribute("data-van")));
    };
    const onKey = (event: KeyboardEvent) => {
      const n = Number(event.key);
      if (n >= 1 && n <= props.vans.length) {
        event.preventDefault();
        choose(n - 1);
      }
    };
    svg.addEventListener("click", onPointer);
    svg.addEventListener("pointerover", onPointer);
    root.current!.addEventListener("keydown", onKey);
    const rootEl = root.current!;
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      svg.removeEventListener("click", onPointer);
      svg.removeEventListener("pointerover", onPointer);
      rootEl.removeEventListener("keydown", onKey);
      crates.forEach((c) => c.el.remove());
    };
    // Las props son estáticas (vienen del servidor); el efecto corre una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restTransform = (() => {
    const o = project(0, 0, 0);
    return `translate(${(restCrate[0] - o[0]).toFixed(2)} ${(restCrate[1] - o[1]).toFixed(2)})`;
  })();

  const svgEl = (
    <svg ref={svgRef} className="iso-svg" viewBox={`0 0 ${props.width} ${props.height}`} role="img" aria-label={props.label} focusable="false">
      <g dangerouslySetInnerHTML={{ __html: props.layers.truck }} />
      <g dangerouslySetInnerHTML={{ __html: props.layers.dock }} />
      <g dangerouslySetInnerHTML={{ __html: props.layers.beltBack }} />
      <g dangerouslySetInnerHTML={{ __html: props.layers.lanes }} />
      <path ref={pointerRef} className="iso-line" data-tone="hi" data-free="end" d={pointerD(restAngle)} style={{ strokeWidth: 1.1 }} />
      <g ref={slotBelt}>
        <g data-rest-crate="" transform={restTransform} dangerouslySetInnerHTML={{ __html: props.crate }} />
      </g>
      <g dangerouslySetInnerHTML={{ __html: props.layers.beltFront }} />
      <g ref={beamRef} className="hub-beam">
        <path className="iso-line" data-tone="mid" d={beamD(0)} />
      </g>
      <g ref={slotOut} />
      {props.vans.map((v, i) => (
        <g key={i} ref={(el) => void (vanRefs.current[i] = el)} data-van={i} className="hub-van" dangerouslySetInnerHTML={{ __html: v }} />
      ))}
    </svg>
  );

  const aria = "Muelle BACO: pulsa 1, 2 o 3 para elegir el hostelero que recibe la siguiente caja";

  if (props.bare) {
    // Integrada en la cabecera verde: sin tarjeta, la figura en blanco sobre el verde.
    return (
      <div ref={root} className="iso hub hub--bare" data-theme="light" tabIndex={0} aria-label={aria}>
        <div className="iso-stage">{svgEl}</div>
      </div>
    );
  }

  return (
    <div ref={root} className="iso hub" data-theme="light" tabIndex={0} aria-label={aria}>
      <figure className="iso-figure">
        <div className="iso-plate">
          <div className="iso-plate-corners" aria-hidden="true">
            <span className="iso-plate-corner" data-corner="fig">
              Fig 1
            </span>
            <span className="iso-plate-corner" data-corner="title">
              Muelle BACO
            </span>
            <span ref={readoutRef} className="iso-plate-corner" data-corner="readout" data-readout="">
              {props.restText}
            </span>
          </div>
          <div className="iso-stage">{svgEl}</div>
        </div>
      </figure>
    </div>
  );
}
