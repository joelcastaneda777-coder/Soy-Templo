"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { submitCareRequest, type CareFormState } from "./actions";

type CareType = "counseling" | "hospital_visit" | "home_visit";

const options: Array<{ value: CareType; title: string; description: string }> = [
  { value: "counseling", title: "Consejería pastoral", description: "Hablar con alguien del equipo pastoral y recibir acompañamiento." },
  { value: "hospital_visit", title: "Visita hospitalaria", description: "Solicitar oración y acompañamiento para una persona hospitalizada." },
  { value: "home_visit", title: "Visita en casa · Plantadores", description: "Coordinar una visita para oración, escucha y acompañamiento en casa." },
];

export function CareRequestForm({
  initialType = "counseling",
  defaultName = "",
  defaultPhone = "",
  defaultEmail = "",
}: {
  initialType?: CareType;
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
}) {
  const [state, formAction, pending] = useActionState<CareFormState, FormData>(submitCareRequest, {});
  const [requestType, setRequestType] = useState<CareType>(initialType);

  if (state.ok) {
    return (
      <div role="status" className="rounded-[var(--radius-card)] border border-balsamo-200 bg-balsamo-100 p-6 text-center">
        <p className="font-display text-xl font-semibold text-balsamo-800">Recibimos tu solicitud.</p>
        <p className="mt-2 text-sm leading-relaxed text-balsamo-800/80">
          El equipo de cuidado la revisará y se pondrá en contacto contigo. Este formulario no sustituye los servicios de emergencia.
        </p>
        {state.tracking ? (
          <Link href="/oracion/mis-solicitudes" className="mt-4 inline-block text-sm font-semibold text-anil-700 underline underline-offset-4">
            Ver el estado de mis solicitudes
          </Link>
        ) : null}
      </div>
    );
  }

  const isVisit = requestType === "hospital_visit" || requestType === "home_visit";

  return (
    <form action={formAction} className="space-y-5 rounded-[var(--radius-card)] border border-manta bg-white p-5 shadow-sm dark:bg-manta">
      <div>
        <p className="font-display text-xl font-semibold text-anil-800">¿Cómo podemos acompañarte?</p>
        <p className="mt-1 text-sm leading-relaxed text-tinta-suave">La información de esta sección es confidencial y no se publica en el muro de oración.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tipo de acompañamiento">
        {options.map((option) => {
          const active = option.value === requestType;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRequestType(option.value)}
              className={`rounded-2xl border p-4 text-left transition-colors ${active ? "border-anil-500 bg-anil-50" : "border-manta hover:border-anil-200"}`}
            >
              <span className="block text-sm font-semibold text-anil-800">{option.title}</span>
              <span className="mt-1 block text-xs leading-relaxed text-tinta-suave">{option.description}</span>
            </button>
          );
        })}
      </div>
      <input type="hidden" name="requestType" value={requestType} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tu nombre" htmlFor="requesterName">
          <Input id="requesterName" name="requesterName" defaultValue={defaultName} required autoComplete="name" />
        </Field>
        <Field label="Cómo prefieres que te contactemos" htmlFor="preferredContact">
          <Select id="preferredContact" name="preferredContact" defaultValue="whatsapp">
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Llamada</option>
            <option value="email">Correo electrónico</option>
          </Select>
        </Field>
        <Field label="Teléfono / WhatsApp" htmlFor="contactPhone">
          <Input id="contactPhone" name="contactPhone" defaultValue={defaultPhone} autoComplete="tel" inputMode="tel" />
        </Field>
        <Field label="Correo" htmlFor="contactEmail">
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={defaultEmail} autoComplete="email" />
        </Field>
      </div>

      {requestType === "hospital_visit" ? (
        <div className="grid gap-4 rounded-2xl bg-balsamo-50 p-4 sm:grid-cols-2">
          <Field label="Nombre de la persona hospitalizada" htmlFor="subjectName">
            <Input id="subjectName" name="subjectName" required />
          </Field>
          <Field label="Tu relación con la persona" htmlFor="relationshipToSubject">
            <Input id="relationshipToSubject" name="relationshipToSubject" placeholder="Familiar, amigo, etc." />
          </Field>
          <Field label="Hospital o centro de salud" htmlFor="hospitalName">
            <Input id="hospitalName" name="hospitalName" required />
          </Field>
          <Field label="Habitación / sala / referencia" htmlFor="roomDetails">
            <Input id="roomDetails" name="roomDetails" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Indicaciones para la visita" htmlFor="locationNotes">
              <Textarea id="locationNotes" name="locationNotes" placeholder="Horarios de visita, ingreso, referencia u otra información útil. No es necesario compartir un diagnóstico médico." />
            </Field>
          </div>
        </div>
      ) : null}

      {requestType === "home_visit" ? (
        <div className="grid gap-4 rounded-2xl bg-balsamo-50 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Dirección donde se solicita la visita" htmlFor="address">
              <Input id="address" name="address" required />
            </Field>
          </div>
          <Field label="Municipio / distrito" htmlFor="municipality">
            <Input id="municipality" name="municipality" />
          </Field>
          <Field label="Punto de referencia" htmlFor="locationNotes">
            <Input id="locationNotes" name="locationNotes" />
          </Field>
        </div>
      ) : null}

      <Field label={requestType === "counseling" ? "Cuéntanos brevemente qué estás atravesando" : "¿Cómo podemos orar y acompañar esta situación?"} htmlFor="message">
        <Textarea id="message" name="message" required minLength={10} maxLength={3000} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="¿Qué tan pronto necesitas respuesta?" htmlFor="priority">
          <Select id="priority" name="priority" defaultValue="normal">
            <option value="normal">Puede esperar</option>
            <option value="soon">Me gustaría que me contacten pronto</option>
            <option value="urgent">Urgente, pero no es una emergencia</option>
          </Select>
        </Field>
        <Field label="Horario que te funciona mejor" htmlFor="preferredSchedule">
          <Input id="preferredSchedule" name="preferredSchedule" placeholder="Ej. tardes después de las 5" />
        </Field>
      </div>

      <div className="space-y-3 rounded-2xl border border-manta p-4 text-sm">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="consentToContact" required className="mt-0.5 h-5 w-5 accent-anil-600" />
          <span>Autorizo a Soy Templo a usar estos datos únicamente para contactarme y dar seguimiento a esta solicitud.</span>
        </label>
        {isVisit ? (
          <label className="flex items-start gap-3">
            <input type="checkbox" name="consentToVisit" required className="mt-0.5 h-5 w-5 accent-anil-600" />
            <span>Confirmo que la persona, familia o responsable conoce y acepta que el equipo de Soy Templo coordine esta visita.</span>
          </label>
        ) : null}
      </div>

      <p className="rounded-2xl bg-cirio-50 p-4 text-xs leading-relaxed text-tinta-suave">
        Si existe una emergencia médica, riesgo de violencia o peligro inmediato, contacta los servicios de emergencia de tu localidad. La consejería pastoral brinda acompañamiento espiritual y no sustituye atención médica, psicológica o de emergencia cuando sea necesaria.
      </p>

      {state.error ? <p role="alert" className="text-sm text-error">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando…" : requestType === "counseling" ? "Solicitar acompañamiento" : "Solicitar visita"}
      </Button>
    </form>
  );
}
