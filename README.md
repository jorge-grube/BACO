# BACO

Buscador que conecta a la hostelería con los productores certificados de la Comunidad de Madrid. El hostelero
escribe lo que necesita ("queso curado de oveja para tapas, 20 kg al mes, cerca de Alcalá") y BACO devuelve los
productos que encajan, ordenados y con el porqué de cada uno. Prototipo para el reto de Aplus Gastromarketing.

## Arrancar

```bash
npm install
npm run seed      # crea data/baco.db a partir de data/catalog.raw.json
npm run dev       # http://localhost:3000
```

Entra en `/entrar` con una de las tres cuentas de demo (hostelera, productor o consumidora). No hay contraseñas.

**Gemini (opcional).** Copia `.env.example` a `.env.local` y pon `GEMINI_API_KEY`. Con clave, el asistente
interpreta la petición con Gemini y, si ejecutas `npm run embed`, la búsqueda usa embeddings. Sin clave todo
funciona igual con reglas en español y un índice léxico con sinónimos de cocina.

## Datos

- `npm run scrape` descarga una muestra (544 productos, 93 empresas) del
  [catálogo M Producto Certificado](https://www.comunidad.madrid/info/productos): producto, categoría, empresa,
  marca y sellos DOP/IGP/DC/ecológico. Respeta el `Crawl-delay` de su robots.txt, así que tarda unos 12 minutos.
- El catálogo no publica ubicación, contacto, precio ni capacidad. `npm run seed` los genera de forma
  reproducible y los marca con `is_mock = 1`. Las reseñas, la actividad y las solicitudes también son de ejemplo.
- Tampoco publica fotos: cada producto lleva una foto ilustrativa de su tipo (Unsplash, ver
  `public/photos/CREDITS.md`), asignada por reglas en `lib/photos.ts` y marcada como "Foto ilustrativa" en la ficha.

## Cómo está hecho

| Carpeta | Qué hay |
| --- | --- |
| `app/` | Páginas (Next.js App Router): portada, `/buscar`, `/producto/[id]`, `/productor/[id]`, `/panel`, `/entrar` y las server actions |
| `lib/db/` | SQLite (better-sqlite3): esquema y repositorio. Es la única capa que toca la base de datos |
| `lib/match/` | El match: `intent.ts` (petición → intención), `search.ts` (filtros, score y explicación), `text.ts` (índice léxico), `gemini.ts` |
| `lib/photos.ts` | Foto ilustrativa de cada producto (reglas nombre/categoría → `lib/photo-library.ts`) y fotos editoriales |
| `components/shot.tsx` | Foto con `next/image`, color de fondo mientras carga y velo para escribir encima |
| `scripts/` | `scrape-catalog.mjs`, `seed.ts`, `embed.ts` |
| `DESIGN.md` | Sistema visual: blanco, Montserrat y acento salvia `#B8D2C3` |

**Score** (ver PDD): `0,45·parecido + 0,20·distancia + 0,15·sello + 0,10·capacidad + 0,10·reseñas + patrocinio (≤ 0,05)`.
Cada resultado enseña su desglose y el patrocinio siempre va etiquetado.

**Paso a Supabase.** Basta con reescribir `lib/db/` con el mismo contrato (Postgres + pgvector para los embeddings
y Supabase Auth en lugar de la cookie de demo de `lib/session.ts`). Las páginas no cambian.

**Limitación conocida.** SQLite escribe en un fichero local: en Vercel las escrituras no persisten. Para la demo,
ejecutar en local; para una URL pública, cambiar a Turso (compatible con SQLite) o a Supabase.
