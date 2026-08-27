"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteAccount, updatePassword, updateProfile, type AccountState } from "./actions";

const initialState: AccountState = {};

function Feedback({ state }: { state: AccountState }) {
  if (state.error) return <p role="alert" className="text-sm text-error">{state.error}</p>;
  if (state.message) return <p role="status" className="text-sm font-medium text-balsamo-700">{state.message}</p>;
  return null;
}

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={action} className="space-y-4 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
      <div>
        <h2 className="font-display text-xl font-semibold">Información personal</h2>
        <p className="mt-1 text-sm text-tinta-suave">Estos datos identifican tu cuenta dentro de Soy Templo.</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Nombre</span>
        <input name="fullName" defaultValue={fullName} required maxLength={120} className="min-h-12 w-full rounded-2xl border border-manta bg-white px-4 outline-none focus:border-anil-500 dark:bg-anil-950" />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Correo</span>
        <input value={email} disabled className="min-h-12 w-full rounded-2xl border border-manta bg-anil-50 px-4 text-tinta-suave dark:bg-anil-900" />
        <span className="text-xs text-tinta-suave">El correo de acceso no se cambia desde esta pantalla.</span>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Teléfono</span>
        <input name="phone" type="tel" defaultValue={phone} maxLength={40} placeholder="+503 0000 0000" className="min-h-12 w-full rounded-2xl border border-manta bg-white px-4 outline-none focus:border-anil-500 dark:bg-anil-950" />
      </label>

      <Feedback state={state} />
      <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar cambios"}</Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={action} className="space-y-4 rounded-[var(--radius-card)] border border-manta bg-white p-5 dark:bg-manta">
      <div>
        <h2 className="font-display text-xl font-semibold">Seguridad</h2>
        <p className="mt-1 text-sm text-tinta-suave">Actualiza tu contraseña de acceso.</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Nueva contraseña</span>
        <input name="password" type="password" minLength={8} required autoComplete="new-password" className="min-h-12 w-full rounded-2xl border border-manta bg-white px-4 outline-none focus:border-anil-500 dark:bg-anil-950" />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Confirmar contraseña</span>
        <input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" className="min-h-12 w-full rounded-2xl border border-manta bg-white px-4 outline-none focus:border-anil-500 dark:bg-anil-950" />
      </label>

      <Feedback state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Actualizando…" : "Cambiar contraseña"}</Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, initialState);

  return (
    <form action={action} className="space-y-4 rounded-[var(--radius-card)] border border-error/30 bg-white p-5 dark:bg-manta">
      <div>
        <h2 className="font-display text-xl font-semibold text-error">Eliminar cuenta</h2>
        <p className="mt-1 text-sm text-tinta-suave">Esta acción elimina tu acceso, perfil, progreso, favoritos, notas y otros datos personales vinculados. Los registros contables que deban conservarse quedan anonimizados.</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold">Escribe ELIMINAR para confirmar</span>
        <input name="confirmation" required autoComplete="off" className="min-h-12 w-full rounded-2xl border border-error/40 bg-white px-4 outline-none focus:border-error dark:bg-anil-950" />
      </label>

      <Feedback state={state} />
      <Button type="submit" variant="danger" disabled={pending}>{pending ? "Eliminando…" : "Eliminar mi cuenta"}</Button>
    </form>
  );
}
