import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display text-3xl font-semibold text-anil-800">Página no encontrada</h1>
      <p className="mt-2 text-tinta-suave">Puede que el contenido se haya movido o ya no exista.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-anil-600 px-6 py-3 font-semibold text-white">
        Volver al inicio
      </Link>
    </div>
  );
}
