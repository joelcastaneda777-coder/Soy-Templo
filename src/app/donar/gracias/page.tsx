import { t } from "@/lib/i18n/es";
import Link from "next/link";

export default function ThanksPage() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="verse-band mx-auto rounded-[--radius-card] p-8">
        <p className="font-display text-2xl">{t.donate.thanks}</p>
      </div>
      <p className="mt-4 text-sm text-tinta-suave">
        Recibirás tu comprobante cuando el proveedor de pagos confirme la transacción.
      </p>
      <Link href="/" className="mt-6 inline-block font-semibold text-anil-600">← {t.nav.home}</Link>
    </div>
  );
}
