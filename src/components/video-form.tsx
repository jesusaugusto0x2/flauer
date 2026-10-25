"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type FormEvent } from "react";
import { saveVideo, type SaveVideoResult } from "@/app/actions";
import type { VideoField } from "@/lib/validation";

type Props = {
  /** When editing: the saved video, with its link rebuilt from where it is. */
  video?: { id: string; link: string; title: string; note: string; vertical: boolean };
  /** Says which date the video gets (today's, or the one it already has). */
  dateNote: string;
  cancelHref?: string;
  /** A new video was saved: the list refreshes on its own. */
  onSaved?: () => void;
};

const FIELD =
  "block w-full rounded-[8px] border border-soft-border bg-night/70 px-3.5 text-[18px] text-light placeholder:text-muted aria-[invalid=true]:border-pink";

/** Link, title, an optional note and whether it was recorded upright. */
export function VideoForm({ video, dateNote, cancelHref, onSaved }: Props) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<SaveVideoResult>({});
  const [saving, startTransition] = useTransition();
  // Next keeps visited pages alive (hidden), so ids must be unique across them.
  const uid = useId();
  const id = (field: string) => `${uid}-${field}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const res = await saveVideo(data);
      if (res.saved || res.redirectTo) {
        // Leave the form clean for the next one (or the next visit).
        form.current?.reset();
        setResult({});
        if (res.redirectTo) router.push(res.redirectTo);
        else onSaved?.();
      } else {
        setResult(res);
      }
    });
  }

  const errors = result.fieldErrors ?? {};
  const describedBy = (field: VideoField, hint?: string) =>
    [errors[field] && id(`${field}-error`), hint].filter(Boolean).join(" ") || undefined;

  return (
    <form ref={form} onSubmit={submit} noValidate className="flex flex-col gap-4">
      {video && <input type="hidden" name="id" value={video.id} />}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("link")} className="text-[17px] text-secondary">
          Enlace del video
        </label>
        <input
          id={id("link")}
          name="link"
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://drive.google.com/file/d/…"
          defaultValue={video?.link}
          aria-invalid={!!errors.link}
          aria-describedby={describedBy("link", id("link-hint"))}
          className={`${FIELD} min-h-12 text-[17px]`}
        />
        <FieldError id={id("link-error")} message={errors.link} />
        <p
          id={id("link-hint")}
          className="text-[15px] leading-snug text-secondary italic"
        >
          En Drive: Compartir → Acceso general → «Cualquier persona con el enlace» →
          Copiar enlace. También sirve un enlace de YouTube.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("title")} className="text-[17px] text-secondary">
          Título
        </label>
        <input
          id={id("title")}
          name="title"
          type="text"
          maxLength={200}
          defaultValue={video?.title}
          aria-invalid={!!errors.title}
          aria-describedby={describedBy("title")}
          className={`${FIELD} min-h-12`}
        />
        <FieldError id={id("title-error")} message={errors.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("note")} className="text-[17px] text-secondary">
          Nota (opcional)
        </label>
        <textarea
          id={id("note")}
          name="note"
          defaultValue={video?.note}
          aria-invalid={!!errors.note}
          aria-describedby={describedBy("note")}
          className={`${FIELD} h-24 resize-none scroll-area py-2.5 leading-snug`}
        />
        <FieldError id={id("note-error")} message={errors.note} />
      </div>

      <label className="flex min-h-11 items-center gap-3 text-[17px]">
        <input
          type="checkbox"
          name="vertical"
          defaultChecked={video?.vertical}
          className="size-5 shrink-0 accent-pink"
        />
        Es vertical (lo grabé con el celular parado)
      </label>

      <p className="text-[16px] text-secondary">{dateNote}</p>

      {result.error && (
        <p role="alert" className="text-[17px] font-semibold text-pink">
          {result.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <button type="submit" className="pill pill-wine px-6" disabled={saving}>
          {saving ? "Guardando…" : video ? "Guardar cambios" : "Guardar video"}
        </button>
        {cancelHref && (
          <Link href={cancelHref} className="pill">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}

/**
 * "+ Agregar video", which opens into the form. It starts open when there are
 * no videos yet, and closes again once one is saved.
 */
export function AddVideo({
  dateNote,
  startOpen,
}: {
  dateNote: string;
  startOpen: boolean;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  return (
    <details
      ref={details}
      open={startOpen}
      className="group rounded-[12px] border border-dashed border-light/40 open:border-solid open:border-soft-border open:bg-light/5"
    >
      <summary className="flex min-h-[54px] cursor-pointer list-none items-center justify-center gap-3 rounded-[12px] px-4 text-[19px] text-light group-open:justify-between group-open:px-5 hover:bg-light/7 group-open:hover:bg-transparent [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">+ Agregar video</span>
        <span className="hidden font-hand text-[28px] leading-none font-semibold group-open:inline">
          Agregar video
        </span>
        <span className="hidden text-[16px] text-secondary group-open:inline">
          Cerrar <span aria-hidden="true">×</span>
        </span>
      </summary>
      <div className="px-5 pt-1 pb-5">
        <VideoForm
          dateNote={dateNote}
          onSaved={() => {
            if (details.current) details.current.open = false;
          }}
        />
      </div>
    </details>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[16px] font-semibold text-pink">
      {message}
    </p>
  );
}
