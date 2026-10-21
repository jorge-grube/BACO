// Municipios de la Comunidad de Madrid usados en la demo, con coordenadas aproximadas
// del casco urbano. Sirven para el filtro por zona y el cálculo de distancias.

export type Municipality = { name: string; lat: number; lng: number; aliases?: string[] };

export const MUNICIPALITIES: Municipality[] = [
  { name: "Madrid", lat: 40.4168, lng: -3.7038, aliases: ["madrid centro", "lavapies", "malasaña", "chamberi", "vallecas", "mercamadrid"] },
  { name: "Alcalá de Henares", lat: 40.4818, lng: -3.3643, aliases: ["alcala"] },
  { name: "Alcobendas", lat: 40.5475, lng: -3.642 },
  { name: "Aranjuez", lat: 40.0323, lng: -3.6036 },
  { name: "Arganda del Rey", lat: 40.3008, lng: -3.4382, aliases: ["arganda"] },
  { name: "Braojos", lat: 41.0408, lng: -3.6406 },
  { name: "Buitrago del Lozoya", lat: 40.9907, lng: -3.6366, aliases: ["buitrago"] },
  { name: "Cadalso de los Vidrios", lat: 40.301, lng: -4.4334, aliases: ["cadalso"] },
  { name: "Campo Real", lat: 40.3375, lng: -3.3836 },
  { name: "Chinchón", lat: 40.1403, lng: -3.4228 },
  { name: "Collado Villalba", lat: 40.635, lng: -4.005, aliases: ["villalba"] },
  { name: "Colmenar de Oreja", lat: 40.1069, lng: -3.3847 },
  { name: "Colmenar Viejo", lat: 40.659, lng: -3.7676, aliases: ["colmenar"] },
  { name: "Fuenlabrada", lat: 40.2842, lng: -3.7942 },
  { name: "Getafe", lat: 40.3083, lng: -3.7327 },
  { name: "Guadarrama", lat: 40.6726, lng: -4.089 },
  { name: "Leganés", lat: 40.327, lng: -3.7635 },
  { name: "Lozoyuela", lat: 40.9227, lng: -3.6197 },
  { name: "Mejorada del Campo", lat: 40.3953, lng: -3.4887 },
  { name: "Miraflores de la Sierra", lat: 40.8133, lng: -3.765, aliases: ["miraflores"] },
  { name: "Morata de Tajuña", lat: 40.2283, lng: -3.4339, aliases: ["morata"] },
  { name: "Navalcarnero", lat: 40.2894, lng: -4.0136 },
  { name: "Pinto", lat: 40.2415, lng: -3.6999 },
  { name: "Rascafría", lat: 40.9036, lng: -3.8784 },
  { name: "San Martín de Valdeiglesias", lat: 40.3622, lng: -4.3989, aliases: ["valdeiglesias", "san martin"] },
  { name: "San Sebastián de los Reyes", lat: 40.5474, lng: -3.6261, aliases: ["sanse"] },
  { name: "Torrejón de Ardoz", lat: 40.4554, lng: -3.4697, aliases: ["torrejon"] },
  { name: "Torrelaguna", lat: 40.8283, lng: -3.5373 },
  { name: "Valdemoro", lat: 40.1908, lng: -3.6739 },
  { name: "Villa del Prado", lat: 40.2779, lng: -4.3048 },
  { name: "Villarejo de Salvanés", lat: 40.168, lng: -3.2742, aliases: ["villarejo"] },
];

export function findMunicipality(name: string | null | undefined): Municipality | undefined {
  if (!name) return undefined;
  const n = normalize(name);
  return MUNICIPALITIES.find(
    (m) => normalize(m.name) === n || m.aliases?.some((a) => normalize(a) === n),
  );
}

// Busca un municipio mencionado dentro de un texto libre.
export function detectMunicipality(text: string): Municipality | undefined {
  const t = ` ${normalize(text)} `;
  let best: { m: Municipality; len: number } | undefined;
  for (const m of MUNICIPALITIES) {
    for (const key of [m.name, ...(m.aliases ?? [])]) {
      const k = normalize(key);
      if (t.includes(` ${k} `) && (!best || k.length > best.len)) best = { m, len: k.length };
    }
  }
  return best?.m;
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Municipios de la Sierra Norte presentes en los datos de la demo (piloto por comarca).
export const SIERRA_NORTE = ["Braojos", "Buitrago del Lozoya", "Lozoyuela", "Rascafría", "Torrelaguna"];
