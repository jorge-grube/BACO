import type { NextConfig } from "next";

// Prototipo con SQLite síncrono (better-sqlite3): todas las páginas se renderizan
// por petición, así que no usamos Cache Components de momento.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
