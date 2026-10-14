"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type FormEvent,
} from "react";
import { saveEntry, type SaveEntryResult } from "@/app/actions";
import type { EntryKind } from "@/db/schema";
import { ENTRY_KINDS, isEntryKind, kindLabel } from "@/lib/kinds";
import { Flower } from "./icons";

type Draft = { kind: EntryKind; date: string; title: string; body: string };

type Props = {
  /** Latest allowed date (today in America/Caracas). */
  today: string;
  /** When editing: the current entry. */
  entry?: Draft & { id: string };
  /** When writing a new one: the date and kind the form was opened with. */
  initialDate?: string;
  initialKind?: EntryKind;
  cancelHref?: string;
};

const DRAFT_DELAY_MS = 600;

// Everything that changes with the kind of entry: paper, colors and wording.
const LOOK = {
  poem: {
    paper: "paper",
    ink: "text-ink",
    label: "text-wine",
    field: "border-ink/25 text-ink placeholder:text-ink-soft/70",
    inputBg: "bg-white/55",
    switchTrack: "bg-ink/8",
    switchOn: "bg-ink text-white",
    switchOff: "text-ink-soft",
    switchOnCenter: "#2a2433",
    switchOffCenter: "#e8e2d6",
    body: "ruled-field min-h-80 py-0 leading-8",
    save: "pill-wine",
    cancel: "border-ink/30 text-ink-soft hover:bg-ink/5",
    titleLabel: "Título",
    placeholder: "Escribe aquí, verso a verso…",
    hint: "El borrador se guarda solo mientras escribes.",
  },
  note: {
    paper: "note-paper",
    ink: "text-note-ink",
    label: "text-note-accent",
    field: "border-note-ink/25 text-note-ink placeholder:text-note-ink-soft/70",
    inputBg: "bg-white/50",
    switchTrack: "bg-note-ink/8",
    switchOn: "bg-note-ink text-white",
    switchOff: "text-note-ink-soft",
    switchOnCenter: "#3a2f1c",
    switchOffCenter: "#e6dcc3",
    body: "min-h-[180px] bg-white/35 py-2.5 leading-normal",
    save: "border-note-accent bg-note-accent font-semibold text-white hover:bg-[#5c440f]",
    cancel: "border-note-ink/30 text-note-ink-soft hover:bg-note-ink/5",
    titleLabel: "Título (opcional)",
    placeholder: "Algo que quieras recordar de hoy…",
    hint: "Las notas aparecen con una flor dorada en el calendario.",
  },
} as const;

function heading(kind: EntryKind, editing: boolean) {
  if (editing) return kind === "poem" ? "Editar poema" : "Editar nota";
  return kind === "poem" ? "Nuevo poema" : "Nueva nota";
}

// The saved draft is read with useSyncExternalStore so its kind can pick the
// right paper on the first client render, without a setState inside an effect.
const subscribeToNothing = () => () => {};

function readStoredDraft(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // No localStorage (private mode, etc.): carry on without a draft.
  }
}

function parseDraft(stored: string | null): Partial<Draft> | null {
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Partial<Draft>;
  } catch {
    return null;
  }
}

export function EntryForm({ today, entry, initialDate, initialKind, cancelHref }: Props) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [result, setResult] = useState<SaveEntryResult>({});
  const [saving, startTransition] = useTransition();

  const draftKey = entry
    ? `flauer:draft:entry:${entry.id}`
    : `flauer:draft:new:${initialDate ?? today}`;
  const initial: Draft = entry ?? {
    kind: initialKind ?? "poem",
    date: initialDate ?? today,
    title: "",
    body: "",
  };

  const storedDraft = useSyncExternalStore(
    subscribeToNothing,
    () => readStoredDraft(draftKey),
    () => null,
  );
  const draftKind = parseDraft(storedDraft)?.kind;
  const [chosenKind, setChosenKind] = useState<EntryKind | null>(null);
  const kind = chosenKind ?? (isEntryKind(draftKind) ? draftKind : initial.kind);
  const look = LOOK[kind];

  // Restore the draft's text fields, if any. (Its kind comes from storedDraft.)
  useEffect(() => {
    const el = form.current;
    const draft = parseDraft(readStoredDraft(draftKey));
    if (el && draft) {
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
    }
    return () => clearTimeout(timer.current);
  }, [draftKey]);

  function readForm(): Draft {
    const data = new FormData(form.current!);
    const formKind = data.get("kind");
    return {
      kind: isEntryKind(formKind) ? formKind : kind,
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
        if (!entry && !values.title.trim() && !values.body.trim()) {
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
      const res = await saveEntry(data);
      if (res.redirectTo) {
        discardDraft();
        // Next keeps this page alive (hidden) after navigating away, so leave the
        // form clean for the next visit instead of showing what was just saved.
        form.current?.reset();
        setChosenKind(null);
        setResult({});
        router.push(res.redirectTo);
      } else {
        setResult(res);
      }
    });
  }

  const errors = result.fieldErrors ?? {};
  const labelClass = `block font-hand text-[22px] leading-tight font-semibold ${look.label}`;
  const fieldClass = `block w-full rounded-[4px] border px-3 ${look.field}`;

  return (
    <>
      <h1 className="mb-5 flex items-center gap-2.5 font-hand text-[44px] leading-[1.05] font-semibold">
        <Flower kind={kind} size={26} />
        {heading(kind, !!entry)}
      </h1>

      <form
        ref={form}
        onSubmit={submit}
        onInput={saveDraft}
        noValidate
        className={`${look.paper} flex flex-col gap-[18px] px-5 pt-6 pb-7 [color-scheme:light]`}
      >
        {entry && <input type="hidden" name="id" value={entry.id} />}

        <fieldset className="flex flex-col gap-1.5">
          <legend
            className={`mb-1.5 font-hand text-[22px] leading-tight font-semibold ${look.ink}`}
          >
            ¿Qué estás escribiendo?
          </legend>
          <div className={`grid grid-cols-2 gap-1 rounded-full p-1 ${look.switchTrack}`}>
            {ENTRY_KINDS.map((k) => {
              const active = k === kind;
              return (
                <label
                  key={k}
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full text-[18px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-wine ${
                    active ? `${look.switchOn} font-semibold` : look.switchOff
                  }`}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={k}
                    checked={active}
                    onChange={() => setChosenKind(k)}
                    className="sr-only"
                  />
                  <Flower
                    kind={k}
                    tone={active ? "light" : "deep"}
                    center={active ? look.switchOnCenter : look.switchOffCenter}
                    size={16}
                  />
                  {kindLabel(k)}
                </label>
              );
            })}
          </div>
          <FieldError id="kind-error" message={errors.kind} />
        </fieldset>

        <div className="flex flex-col gap-1">
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
            className={`${fieldClass} ${look.inputBg} min-h-11 py-1.5 text-[19px]`}
          />
          <FieldError id="date-error" message={errors.date} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="title" className={labelClass}>
            {look.titleLabel}
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
            className={`${fieldClass} ${look.inputBg} min-h-11 py-1.5 ${
              kind === "poem" ? "text-[22px] font-semibold" : "text-[20px]"
            }`}
          />
          <FieldError id="title-error" message={errors.title} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="body" className={labelClass}>
            {kindLabel(kind)}
          </label>
          <textarea
            id="body"
            name="body"
            required
            placeholder={look.placeholder}
            defaultValue={initial.body}
            aria-invalid={!!errors.body}
            aria-describedby={errors.body ? "body-error" : undefined}
            className={`${fieldClass} field-sizing-content resize-none text-[19px] ${look.body}`}
          />
          <FieldError id="body-error" message={errors.body} />
        </div>

        {result.error && (
          <p role="alert" className="text-[17px] font-semibold text-wine">
            {result.error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <button type="submit" className={`pill px-6 ${look.save}`} disabled={saving}>
            {saving
              ? "Guardando…"
              : entry
                ? "Guardar cambios"
                : kind === "poem"
                  ? "Guardar poema"
                  : "Guardar nota"}
          </button>
          {entry && cancelHref && (
            <Link
              href={cancelHref}
              onClick={discardDraft}
              className={`pill ${look.cancel}`}
            >
              Cancelar
            </Link>
          )}
        </div>
      </form>

      <p className="mt-5 text-center text-[15px] text-secondary italic">{look.hint}</p>
    </>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[16px] font-semibold text-wine">
      {message}
    </p>
  );
}
