import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RiArrowLeftSLine } from "@remixicon/react";
import { CodeForm } from "@/components/forms-extra";
import { DemoNote } from "@/components/phone-message";
import { isDemoPhone, latestLoginCode, profileByPhone } from "@/lib/db/repo";

export const metadata: Metadata = { title: "Código de acceso" };

export default async function CodePage({ searchParams }: { searchParams: Promise<{ tel?: string; next?: string }> }) {
  const { tel = "", next } = await searchParams;
  const profile = /^\d{9}$/.test(tel) ? profileByPhone(tel) : undefined;
  if (!profile) redirect("/entrar");
  // El código solo se enseña para las cuentas de demo; a una persona real le llegaría por SMS.
  const code = isDemoPhone(tel) ? latestLoginCode(tel) : undefined;
  const masked = `${tel.slice(0, 3)} ··· ${tel.slice(6)}`;

  return (
    <div className="mx-auto max-w-md px-5 pt-10">
      <Link href="/entrar" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-[15px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
        <RiArrowLeftSLine className="size-5" aria-hidden /> Cambiar de número
      </Link>
      <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-[-0.03em]">Escribe el código</h1>
      <p className="mt-2 text-[17px] text-ink-2">
        Te lo hemos mandado por SMS al <span className="font-semibold text-ink tabular-nums">{masked}</span>. Caduca en 10 minutos.
      </p>
      <div className="mt-6" data-help="login-code">
        <CodeForm phone={tel} next={next} />
      </div>
      <div className="mt-6 space-y-3">
        {code && <DemoNote>en la demo no se envían SMS. Tu código es <span className="font-semibold tabular-nums">{code}</span>.</DemoNote>}
        <p className="text-[15px] text-ink-2">
          ¿No te llega?{" "}
          <Link href="/entrar" className="font-semibold text-ink underline underline-offset-2">
            Pide otro código
          </Link>{" "}
          o pulsa «Ayuda» y te llamamos.
        </p>
      </div>
    </div>
  );
}
