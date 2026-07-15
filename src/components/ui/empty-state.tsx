export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-[--radius-card] border border-dashed border-anil-100 bg-manta/50 p-10 text-center">
      <p className="font-display text-lg text-tinta">{title}</p>
      {hint ? <p className="mt-2 text-sm text-tinta-suave">{hint}</p> : null}
    </div>
  );
}
