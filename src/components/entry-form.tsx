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
  type ReactNode,
} from "react";
import { saveEntry, type SaveEntryResult } from "@/app/actions";
import type { EntryKind } from "@/db/schema";
import { ENTRY_KINDS, isEntryKind, kindLabel } from "@/lib/kinds";
import type { EntryField } from "@/lib/validation";
import { Flower } from "./icons";
import { SIDE_COLUMN } from "./side-column";

type Draft = {
  kind: EntryKind;
  date: string;
  title: string;
  body: string;
  artist: string;
  spotifyUrl: string;
};

const TEXT_FIELDS = ["date", "title", "body", "artist", "spotifyUrl"] as const;

type Props = {
  /** Latest allowed date (today in America/Caracas). */
  today: string;
  /** When editing: the current entry. */
  entry?: Draft & { id: string };
  /** When writing a new one: the date and kind the form was opened with. */
  initialDate?: string;
  initialKind?: EntryKind;
  cancelHref?: string;
  /** Desktop side column (the day being written and what's already in it). */
  aside?: ReactNode;
};

const DRAFT_DELAY_MS = 600;

// Everything that changes with the kind of entry: paper, colors and wording.
const LOOK = {
  poem: {
    // Poems get wider ruling on desktop, matching the bigger type.
    paper: "paper lg:[--rule:38px]",
    paperColor: "#f4eee3",
    ink: "text-ink",
    heading: "text-ink-title",
    label: "text-wine",
    field: "border-ink/25 text-ink placeholder:text-ink-soft/70",
    inputBg: "bg-white/55",
    scrollThumb: "[--scroll-thumb:rgba(42,36,51,0.35)]",
    switchTrack: "bg-ink/8",
    switchOn: "bg-ink text-white",
    switchOff: "text-ink-soft",
    switchOnCenter: "#2a2433",
    switchOffCenter: "#e8e2d6",
    titleLabel: "Título",
    titlePlaceholder: "Sin título",
    title: "text-[22px] font-semibold lg:text-[24px]",
    bodyLabel: "Poema",
    bodyPlaceholder: "Escribe aquí, verso a verso…",
    // Fixed height, own scroll. 10 lines of 32px; 12 of 38px on desktop.
    body: "ruled-field h-80 py-0 text-[19px] leading-8 lg:h-[456px] lg:text-[23px] lg:leading-[38px]",
    save: "pill-wine",
    saveLabel: "Guardar poema",
    cancel: "border-ink/30 text-ink-soft hover:bg-ink/5",
    hint: "El borrador se guarda solo mientras escribes.",
  },
  note: {
    paper: "note-paper",
    paperColor: "#f3e9cf",
    ink: "text-note-ink",
    heading: "text-note-ink",
    label: "text-note-accent",
    field: "border-note-ink/25 text-note-ink placeholder:text-note-ink-soft/70",
    inputBg: "bg-white/50",
    scrollThumb: "[--scroll-thumb:rgba(58,47,28,0.35)]",
    switchTrack: "bg-note-ink/8",
    switchOn: "bg-note-ink text-white",
    switchOff: "text-note-ink-soft",
    switchOnCenter: "#3a2f1c",
    switchOffCenter: "#e6dcc3",
    titleLabel: "Título (opcional)",
    titlePlaceholder: "Sin título",
    title: "text-[20px] lg:text-[21px]",
    bodyLabel: "Nota",
    bodyPlaceholder: "Algo que quieras recordar de hoy…",
    body: "h-[180px] bg-white/35 py-2.5 text-[19px] leading-normal lg:h-[240px] lg:py-3 lg:text-[21px]",
    save: "border-note-accent bg-note-accent font-semibold text-white hover:bg-[#5c440f]",
    saveLabel: "Guardar nota",
    cancel: "border-note-ink/30 text-note-ink-soft hover:bg-note-ink/5",
    hint: "Las notas aparecen con una flor dorada en el calendario.",
  },
  song: {
    paper: "song-paper",
    paperColor: "#ebe7f6",
    ink: "text-song-ink",
    heading: "text-song-ink",
    label: "text-song-accent",
    field: "border-song-ink/25 text-song-ink placeholder:text-song-ink-soft/70",
    inputBg: "bg-white/55",
    scrollThumb: "[--scroll-thumb:rgba(42,38,71,0.35)]",
    switchTrack: "bg-song-ink/8",
    switchOn: "bg-song-ink text-white",
    switchOff: "text-song-ink-soft",
    switchOnCenter: "#2a2647",
    switchOffCenter: "#e0dcec",
    titleLabel: "Canción",
    titlePlaceholder: "Nombre de la canción",
    title: "text-[21px] font-semibold lg:text-[22px]",
    bodyLabel: "Por qué te identifica (opcional)",
    bodyPlaceholder: "Lo que te hace sentir…",
    body: "h-[120px] bg-white/35 py-2.5 text-[18px] leading-normal lg:h-[180px] lg:py-3 lg:text-[20px]",
    save: "border-song-accent bg-song-accent font-semibold text-white hover:bg-[#3d3375]",
    saveLabel: "Guardar canción",
    cancel: "border-song-ink/30 text-song-ink-soft hover:bg-song-ink/5",
    hint: "En el diario, la canción se abre en Spotify con un toque.",
  },
} as const;

const HEADINGS: Record<EntryKind, { new: string; edit: string }> = {
  poem: { new: "Nuevo poema", edit: "Editar poema" },
  note: { new: "Nueva nota", edit: "Editar nota" },
  song: { new: "Nueva canción", edit: "Editar canción" },
};

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

export function EntryForm({
  today,
  entry,
  initialDate,
  initialKind,
  cancelHref,
  aside,
}: Props) {
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
    artist: "",
    spotifyUrl: "",
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
  const isSong = kind === "song";

  // Restore the draft's text fields, if any. (Its kind comes from storedDraft.)
  useEffect(() => {
    const el = form.current;
    const draft = parseDraft(readStoredDraft(draftKey));
    if (el && draft) {
      for (const field of TEXT_FIELDS) {
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
    const text = (field: (typeof TEXT_FIELDS)[number]) => String(data.get(field) ?? "");
    return {
      kind: isEntryKind(formKind) ? formKind : kind,
      date: text("date"),
      title: text("title"),
      body: text("body"),
      artist: text("artist"),
      spotifyUrl: text("spotifyUrl"),
    };
  }

  function saveDraft() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        const values = readForm();
        const empty = !(
          values.title +
          values.body +
          values.artist +
          values.spotifyUrl
        ).trim();
        if (!entry && empty) {
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
  const heading = HEADINGS[kind][entry ? "edit" : "new"];
  const labelClass = `block font-hand text-[22px] leading-tight font-semibold ${look.label}`;
  const fieldClass = `block w-full rounded-[4px] border px-3 lg:px-3.5 ${look.field}`;
  const inputClass = `${fieldClass} ${look.inputBg} min-h-11 py-1.5 lg:h-[50px]`;
  const describedBy = (field: EntryField) =>
    errors[field] ? `${field}-error` : undefined;

  // Phones: heading, then the form on paper, then the hint. Desktop: a side column
  // (aside + hint) next to a wider sheet that carries its own heading.
  return (
    <div className="lg:flex lg:flex-wrap lg:items-start lg:gap-12">
      {aside && (
        <aside
          aria-label="Este día"
          className={`hidden min-w-0 flex-col gap-[18px] lg:flex ${SIDE_COLUMN} lg:flex-[1_1_280px]`}
        >
          {aside}
          <p className="shrink-0 text-[15px] text-secondary italic">{look.hint}</p>
        </aside>
      )}

      <div className="min-w-0 lg:max-w-[760px] lg:flex-[999_1_600px]">
        <h1 className="mb-5 flex items-center gap-2.5 font-hand text-[44px] leading-[1.05] font-semibold lg:hidden">
          <Flower kind={kind} size={26} />
          {heading}
        </h1>

        <form
          ref={form}
          onSubmit={submit}
          onInput={saveDraft}
          noValidate
          className={`${look.paper} ${look.scrollThumb} flex flex-col gap-[18px] px-5 pt-6 pb-7 [color-scheme:light] shadow-[0_20px_40px_rgba(0,0,0,0.45)] lg:gap-[22px] lg:px-14 lg:pt-10 lg:pb-12 lg:shadow-[0_30px_60px_rgba(0,0,0,0.45)]`}
        >
          {entry && <input type="hidden" name="id" value={entry.id} />}

          <div className="flex flex-col gap-[18px] lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-x-5 lg:gap-y-3">
            {/* Desktop heading, inside the sheet. Only one of the two h1 is ever displayed. */}
            <h1
              className={`hidden items-center gap-2.5 font-hand text-[40px] leading-none font-semibold lg:flex ${look.heading}`}
            >
              <Flower kind={kind} tone="deep" center={look.paperColor} size={24} />
              {heading}
            </h1>

            <fieldset className="flex flex-col gap-1.5 lg:w-[420px] lg:max-w-full">
              <legend
                className={`mb-1.5 font-hand text-[22px] leading-tight font-semibold lg:sr-only ${look.ink}`}
              >
                ¿Qué estás escribiendo?
              </legend>
              <div
                className={`grid grid-cols-3 gap-1 rounded-full p-1 ${look.switchTrack}`}
              >
                {ENTRY_KINDS.map((k) => {
                  const active = k === kind;
                  return (
                    <label
                      key={k}
                      className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full text-[17px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-wine lg:gap-2 lg:text-[18px] ${
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
                        size={15}
                        className="shrink-0 lg:size-4"
                      />
                      {kindLabel(k)}
                    </label>
                  );
                })}
              </div>
              <FieldError id="kind-error" message={errors.kind} />
            </fieldset>
          </div>

          {/* The same fields in the same order for every kind (so nothing typed is
              lost when switching); songs show two more. On desktop they wrap into
              rows: Date + Title, or Date + Link / Song + Artist. */}
          <div className="flex flex-col gap-[18px] lg:flex-row lg:flex-wrap lg:gap-x-5 lg:gap-y-[22px]">
            <div className="flex min-w-0 flex-col gap-1 lg:flex-[1_1_200px]">
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
                aria-describedby={describedBy("date")}
                className={`${inputClass} text-[19px]`}
              />
              <FieldError id="date-error" message={errors.date} />
            </div>

            <div
              hidden={!isSong}
              className="flex min-w-0 flex-col gap-1 lg:flex-[3_1_300px]"
            >
              <label htmlFor="spotifyUrl" className={labelClass}>
                Enlace de Spotify
              </label>
              <input
                id="spotifyUrl"
                name="spotifyUrl"
                type="url"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://open.spotify.com/track/…"
                defaultValue={initial.spotifyUrl}
                aria-invalid={!!errors.spotifyUrl}
                aria-describedby={describedBy("spotifyUrl")}
                className={`${inputClass} text-[17px] lg:text-[18px]`}
              />
              <FieldError id="spotifyUrl-error" message={errors.spotifyUrl} />
            </div>

            <div className="flex min-w-0 flex-col gap-1 lg:flex-[3_1_300px]">
              <label htmlFor="title" className={labelClass}>
                {look.titleLabel}
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder={look.titlePlaceholder}
                maxLength={200}
                defaultValue={initial.title}
                aria-invalid={!!errors.title}
                aria-describedby={describedBy("title")}
                className={`${inputClass} ${look.title}`}
              />
              <FieldError id="title-error" message={errors.title} />
            </div>

            <div
              hidden={!isSong}
              className="flex min-w-0 flex-col gap-1 lg:flex-[2_1_220px]"
            >
              <label htmlFor="artist" className={labelClass}>
                Artista
              </label>
              <input
                id="artist"
                name="artist"
                type="text"
                placeholder="Quién la canta"
                maxLength={200}
                defaultValue={initial.artist}
                aria-invalid={!!errors.artist}
                aria-describedby={describedBy("artist")}
                className={`${inputClass} text-[19px] lg:text-[20px]`}
              />
              <FieldError id="artist-error" message={errors.artist} />
            </div>

            <div className="flex min-w-0 flex-col gap-1 lg:basis-full">
              <label htmlFor="body" className={labelClass}>
                {look.bodyLabel}
              </label>
              <textarea
                id="body"
                name="body"
                required={!isSong}
                placeholder={look.bodyPlaceholder}
                defaultValue={initial.body}
                aria-invalid={!!errors.body}
                aria-describedby={describedBy("body")}
                className={`${fieldClass} resize-none scroll-area ${look.body}`}
              />
              <FieldError id="body-error" message={errors.body} />
            </div>
          </div>

          {result.error && (
            <p role="alert" className="text-[17px] font-semibold text-wine">
              {result.error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="submit"
              className={`pill px-6 lg:min-h-[50px] lg:px-7 lg:text-[19px] ${look.save}`}
              disabled={saving}
            >
              {saving ? "Guardando…" : entry ? "Guardar cambios" : look.saveLabel}
            </button>
            {entry && cancelHref && (
              <Link
                href={cancelHref}
                onClick={discardDraft}
                className={`pill lg:min-h-[50px] ${look.cancel}`}
              >
                Cancelar
              </Link>
            )}
          </div>
        </form>

        <p className="mt-5 text-center text-[15px] text-secondary italic lg:hidden">
          {look.hint}
        </p>
      </div>
    </div>
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
