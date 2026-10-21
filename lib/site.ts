import { headers } from "next/headers";
import QRCode from "qrcode";

// Dirección pública de la web (para los QR). NEXT_PUBLIC_SITE_URL manda; si no, la del propio servidor.
export async function siteOrigin() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fixed) return fixed.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function qrSvg(url: string) {
  return QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#141816", light: "#ffffff" } });
}
