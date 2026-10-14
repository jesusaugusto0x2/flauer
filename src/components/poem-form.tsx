"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { savePoem, type SavePoemResult } from "@/app/actions";

type Props = {
  /** Latest allowed date (today in America/Caracas). */
  today: string;
  /** When editing: the current poem. */
  poem?: { id: string; date: string; title: string; body: string };
  /** When writing a new one: the date the form was opened with. */
  initialDate?: string;
  cancelHref?: string;
};

const DRAFT_DELAY_MS = 600;

type Draft = { date: string; title: string; body: string };

export function PoemForm({ today, poem, initialDate, cancelHref }: Props) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [result, setResult] = useState<SavePoemResult>({});
  const [saving, startTransition] = useTransition();

  const draftKey = poem
    ? `flauer:draft:poem:${poem.id}`
    : `flauer:draft:new:${initialDate ?? today}`;
  const initial: Draft = poem ?? { date: initialDate ?? today, title: "", body: "" };

  // Restore the saved draft, if any.
  useEffect(() => {
    const el = form.current;
    if (!el) return;
    try {
      const stored = localStorage.getItem(draftKey);
      if (!stored) return;
      const draft = JSON.parse(stored) as Partial<Draft>;
      for (const field of ["date", "title", "body"] as const) {
        const value = draft[field];
        const control = el.elements.namedItem(field);
        if (
          typeof value === "string" &&
          (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)
        ) {
          control.value = value;
        }
      }
    } catch {
      // No localStorage (private mode, etc.): carry on without a draft.
    }
    return () => clearTimeout(timer.current);
  }, [draftKey]);

  function readForm(): Draft {
    const data = new FormData(form.current!);
    return {
      date: String(data.get("date") ?? ""),
      title: String(data.get("title") ?? ""),
      body: String(data.get("body") ?? ""),
    };
  }

  function saveDraft() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        const values = readForm();
        if (!poem && !values.title.trim() && !values.body.trim()) {
          localStorage.removeItem(draftKey);
        } else {
          localStorage.setItem(draftKey, JSON.stringify(values));
        }
      } catch {
        // Ignored: the draft is a convenience, not a requirement.
      }
    }, DRAFT_DELAY_MS);
  }

  function discardDraft() {
    clearTimeout(timer.current);
    try {
      localStorage.removeItem(draftKey);
    } catch {}
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = await savePoem(data);
      if (res.redirectTo) {
        discardDraft();
        router.push(res.redirectTo);
      } else {
        setResult(res);
      }
    });
  }

  const errors = result.fieldErrors ?? {};
  const labelClass = "block font-hand text-[22px] leading-8 font-semibold text-wine";
  const controlClass =
    "block w-full bg-transparent text-ink-title placeholder:text-ink-soft/70 focus-visible:outline-offset-2";

  return (
    <>
      <form
        ref={form}
        onSubmit={submit}
        onInput={saveDraft}
        noValidate
        className="paper px-6 pt-8 pb-8 [color-scheme:light]"
      >
        {poem && <input type="hidden" name="id" value={poem.id} />}

        <label htmlFor="date" className={labelClass}>
          Fecha
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          max={today}
          defaultValue={initial.date}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? "date-error" : undefined}
          className={`${controlClass} h-8 text-[19px] leading-8`}
        />
        <FieldError id="date-error" message={errors.date} />

        <label htmlFor="title" className={`${labelClass} mt-8`}>
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Sin título"
          maxLength={200}
          defaultValue={initial.title}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={`${controlClass} h-8 text-[22px] leading-8 font-semibold`}
        />
        <FieldError id="title-error" message={errors.title} />

        <label htmlFor="body" className={`${labelClass} mt-8`}>
          Poema
        </label>
        <textarea
          id="body"
          name="body"
          required
          placeholder="Escribe aquí, verso a verso…"
          defaultValue={initial.body}
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? "body-error" : undefined}
          className={`${controlClass} field-sizing-content min-h-64 resize-none p-0 text-[19px] leading-8`}
        />
        <FieldError id="body-error" message={errors.body} />

        {result.error && (
          <p role="alert" className="text-wine mt-8 text-[17px] leading-8 font-semibold">
            {result.error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="submit" className="pill pill-wine px-6" disabled={saving}>
            {saving ? "Guardando…" : poem ? "Guardar cambios" : "Guardar en el diario"}
          </button>
          {poem && cancelHref && (
            <Link
              href={cancelHref}
              onClick={discardDraft}
              className="pill border-ink/30 text-ink hover:bg-ink/5"
            >
              Cancelar
            </Link>
          )}
        </div>
      </form>

      <p className="text-secondary mt-5 text-center text-[16px] italic">
        El borrador se guarda solo mientras escribes.
      </p>
    </>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-wine text-[16px] leading-8 font-semibold">
      {message}
    </p>
  );
}
