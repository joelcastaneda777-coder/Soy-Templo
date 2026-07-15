"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Field, Select } from "@/components/ui/input";
import { createDonation, type DonationFormState } from "./actions";
import { t } from "@/lib/i18n/es";
import { cn } from "@/lib/utils";

const presets = [500, 1000, 2500, 5000, 10000]; // en centavos

export function DonationForm({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const [state, formAction, pending] = useActionState<DonationFormState, FormData>(createDonation, {});
  const [amountCents, setAmountCents] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  const effectiveAmount = customAmount ? Math.round(Number(customAmount) * 100) : amountCents;
  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <fieldset>
        <legend className="mb-2 block text-sm font-semibold">{t.donate.amount} (USD)</legend>
        <div className="grid grid-cols-3 gap-2">
          {presets.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => { setAmountCents(cents); setCustomAmount(""); }}
              aria-pressed={!customAmount && amountCents === cents}
              className={cn(
                "min-h-12 rounded-xl border font-semibold",
                !customAmount && amountCents === cents
                  ? "border-anil-600 bg-anil-600 text-white"
                  : "border-manta bg-white text-tinta hover:border-anil-300"
              )}
            >
              ${(cents / 100).toFixed(0)}
            </button>
          ))}
          <Input
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            placeholder={t.donate.custom}
            aria-label={t.donate.custom}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="col-span-1"
          />
        </div>
        {state.fieldErrors?.amountCents ? (
          <p role="alert" className="mt-1 text-sm text-error">{state.fieldErrors.amountCents}</p>
        ) : null}
      </fieldset>

      <Field label={t.donate.category} htmlFor="categoryId">
        <Select id="categoryId" name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="isAnonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="h-5 w-5 accent-anil-600"
        />
        <span className="text-sm font-medium">{t.donate.anonymous}</span>
      </label>

      {!isAnonymous ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.donate.name} htmlFor="donorName">
            <Input id="donorName" name="donorName" autoComplete="name" />
          </Field>
          <Field label={t.donate.email} htmlFor="donorEmail">
            <Input id="donorEmail" name="donorEmail" type="email" autoComplete="email" />
            {state.fieldErrors?.donorEmail ? (
              <p role="alert" className="text-sm text-error">{state.fieldErrors.donorEmail}</p>
            ) : null}
          </Field>
        </div>
      ) : null}

      <input type="hidden" name="amountCents" value={effectiveAmount} />
      <input type="hidden" name="categorySlug" value={selectedCategory?.slug ?? ""} />

      {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}

      <Button variant="accent" type="submit" disabled={pending} className="w-full">
        {pending ? t.common.loading : `${t.donate.submit} · $${(effectiveAmount / 100 || 0).toFixed(2)}`}
      </Button>
    </form>
  );
}
