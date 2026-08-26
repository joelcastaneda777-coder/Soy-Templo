import type { Metadata } from "next";
import { SermonForm } from "./sermon-form";

export const metadata: Metadata = { title: "Publicar sermón · Panel" };

export default function NewSermonPage() {
  return (
    <div className="max-w-xl space-y-5">
      <h1 className="font-display text-2xl font-semibold text-anil-800">Publicar sermón</h1>
      <SermonForm />
    </div>
  );
}
