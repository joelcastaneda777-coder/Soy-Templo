"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Field, Select } from "@/components/ui/input";
import { createDonation, type DonationFormState } from "./actions";
import { t } from "@/lib/i18n/es";
import { cn } from "@/lib/utils";

const presets = [500, 1000, 2500, 5000, 10000];

export function DonationForm({ categories, onlineEnabled }: { categories: { id: string; name: string; slug: string }[]; onlineEnabled: boolean }) {
  const [state, formAction, pending] = useActionState<DonationFormState, FormData>(createDonation, {});
  const [amountCents, setAmountCents] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const effectiveAmount = customAmount ? Math.round(Number(customAmount) * 100) : amountCents;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {!onlineEnabled ? (
        <div className="rounded-[1.35rem] border border-[#D7A84A]/20 bg-[#FFF6DE]/75 p-4 text-sm text-[#684C17] backdrop-blur-xl">
          <p className="font-semibold">PayPal institucional · pendiente</p>
          <p className="mt-1 text-xs leading-relaxed opacity-75">La experiencia ya está preparada. Activaremos el pago cuando estén conectadas las credenciales oficiales.</p>
        </div>
      ) : null}

      <fieldset disabled={!onlineEnabled}>
        <legend className="mb-3 block text-xs font-bold uppercase tracking-[.16em] text-[#0A6A68]">{t.donate.amount} (USD)</legend>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((cents) => (
            <button key={cents} type="button" onClick={() => { setAmountCents(cents); setCustomAmount(""); }} aria-pressed={!customAmount && amountCents === cents} className={cn("min-h-12 rounded-[1.1rem] border font-semibold transition", !customAmount && amountCents === cents ? "border-[#063F47] bg-[#063F47] text-white shadow-[0_8px_20px_rgba(6,63,71,.18)]" : "border-[#063F47]/10 bg-[#EFF7F2]/80 text-[#063F47] hover:border-[#0A6A68]/35 hover:bg-white")}>
              ${(cents / 100).toFixed(0)}
            </button>
          ))}
          <Input type="number" inputMode="decimal" min="1" step="0.01" placeholder={t.donate.custom} aria-label={t.donate.custom} value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} />
        </div>
        {state.fieldErrors?.amountCents ? <p role="alert" className="mt-1 text-sm text-error">{state.fieldErrors.amountCents}</p> : null}
      </fieldset>

      <Field label={t.donate.category} htmlFor="categoryId">
        <Select id="categoryId" name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={!onlineEnabled}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
      </Field>

      <label className="flex items-center gap-3 rounded-[1.15rem] border border-[#063F47]/8 bg-[#EFF7F2]/70 px-4 py-3">
        <input type="checkbox" name="isAnonymous" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} disabled={!onlineEnabled} className="h-5 w-5 accent-[#063F47]" />
        <span className="text-sm font-medium text-[#063F47]">{t.donate.anonymous}</span>
      </label>

      {!isAnonymous ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.donate.name} htmlFor="donorName"><Input id="donorName" name="donorName" autoComplete="name" disabled={!onlineEnabled} /></Field>
          <Field label={t.donate.email} htmlFor="donorEmail"><Input id="donorEmail" name="donorEmail" type="email" autoComplete="email" disabled={!onlineEnabled} />{state.fieldErrors?.donorEmail ? <p role="alert" className="text-sm text-error">{state.fieldErrors.donorEmail}</p> : null}</Field>
        </div>
      ) : null}

      <input type="hidden" name="amountCents" value={effectiveAmount} />
      {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}
      <Button variant="accent" type="submit" disabled={pending || !onlineEnabled || !categoryId} className="w-full !rounded-[1.2rem] !bg-[#063F47] !text-white !shadow-[0_10px_24px_rgba(6,63,71,.18)]">
        {!onlineEnabled ? "PayPal próximamente" : pending ? t.common.loading : `${t.donate.submit} · $${(effectiveAmount / 100 || 0).toFixed(2)}`}
      </Button>
    </form>
  );
}
