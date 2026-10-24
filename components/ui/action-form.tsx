"use client";

import { cloneElement, isValidElement, useActionState, useId, useRef, type ReactElement, type ReactNode } from "react";
import type { ActionState } from "@/types/adventures";

export const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-2xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-white";
export const secondaryClass = "inline-flex min-h-11 items-center justify-center rounded-2xl border border-stone-500/25 px-4 py-2 text-sm font-medium transition hover:bg-stone-500/10";

export function ActionForm({ action, children, label = "Save", confirm, className = "", reset = false }: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children?: ReactNode; label?: string; confirm?: string; className?: string; reset?: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, submit, pending] = useActionState(async (previous: ActionState, form: FormData) => {
    const next = await action(previous, form);
    if (next.success && reset) ref.current?.reset();
    return next;
  }, {});
  return (
    <form ref={ref} action={submit} onSubmit={event => {
      if (confirm && !window.confirm(confirm)) event.preventDefault();
    }} className={`space-y-4 ${className}`}>
      <fieldset disabled={pending} className="min-w-0 space-y-4">
        {children}
        {state.error && <p role="alert" className="rounded-xl bg-red-100 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">{state.error}</p>}
        {state.fields && <ul role="alert" className="list-inside list-disc text-sm text-red-800 dark:text-red-200">{Object.entries(state.fields).map(([field, error]) => <li key={field}>{field.replaceAll("_", " ")}: {error}</li>)}</ul>}
        {state.success && <p role="status" className="text-sm text-emerald-800 dark:text-emerald-200">{state.success}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={buttonClass}>{pending ? "Saving…" : label}</button>
          {reset && state.success && <button type="button" className={secondaryClass} onClick={() => ref.current?.reset()}>Clear form</button>}
        </div>
      </fieldset>
    </form>
  );
}

export function Field({ label, name, children, hint, ...props }: {
  label: string; name: string; children?: ReactNode; hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const describedBy = hint ? `${id}-hint` : undefined;
  return <div className="min-w-0 space-y-1.5 text-sm font-medium">
    <label htmlFor={id} className="block">{label}</label>
    {isValidElement(children) ? cloneElement(children as ReactElement<{ id?: string; "aria-describedby"?: string }>,{ id,"aria-describedby": describedBy }) : <input name={name} {...props} id={id} aria-describedby={describedBy} className="travel-input" />}
    {hint && <p id={describedBy} className="text-xs font-normal leading-5 text-stone-600 dark:text-stone-400">{hint}</p>}
  </div>;
}
