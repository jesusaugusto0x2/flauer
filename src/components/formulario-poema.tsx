"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { guardarPoema, type ResultadoGuardar } from "@/app/acciones";

type Props = {
  /** Fecha máxima permitida (hoy en America/Caracas). */
  hoy: string;
  /** Al editar: el poema actual. */
  poema?: { id: string; fecha: string; titulo: string; texto: string };
  /** Al escribir uno nuevo: la fecha con la que se abrió el formulario. */
  fechaInicial?: string;
  cancelar?: string;
};

const ESPERA_BORRADOR_MS = 600;

type Borrador = { fecha: string; titulo: string; texto: string };

export function FormularioPoema({ hoy, poema, fechaInicial, cancelar }: Props) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [estado, setEstado] = useState<ResultadoGuardar>({});
  const [guardando, startTransition] = useTransition();

  const clave = poema
    ? `flauer:borrador:poema:${poema.id}`
    : `flauer:borrador:nuevo:${fechaInicial ?? hoy}`;
  const valoresIniciales: Borrador = poema ?? {
    fecha: fechaInicial ?? hoy,
    titulo: "",
    texto: "",
  };

  // Restaura el borrador guardado, si hay.
  useEffect(() => {
    const form = formulario.current;
    if (!form) return;
    try {
      const guardado = localStorage.getItem(clave);
      if (!guardado) return;
      const borrador = JSON.parse(guardado) as Partial<Borrador>;
      for (const campo of ["fecha", "titulo", "texto"] as const) {
        const valor = borrador[campo];
        const control = form.elements.namedItem(campo);
        if (
          typeof valor === "string" &&
          control instanceof HTMLElement &&
          "value" in control
        ) {
          (control as HTMLInputElement).value = valor;
        }
      }
    } catch {
      // Sin localStorage (modo privado, etc.): seguimos sin borrador.
    }
    return () => clearTimeout(temporizador.current);
  }, [clave]);

  function leerFormulario(): Borrador {
    const datos = new FormData(formulario.current!);
    return {
      fecha: String(datos.get("fecha") ?? ""),
      titulo: String(datos.get("titulo") ?? ""),
      texto: String(datos.get("texto") ?? ""),
    };
  }

  function guardarBorrador() {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      try {
        const valores = leerFormulario();
        if (!poema && !valores.titulo.trim() && !valores.texto.trim()) {
          localStorage.removeItem(clave);
        } else {
          localStorage.setItem(clave, JSON.stringify(valores));
        }
      } catch {
        // Ignorado: el borrador es una ayuda, no un requisito.
      }
    }, ESPERA_BORRADOR_MS);
  }

  function olvidarBorrador() {
    clearTimeout(temporizador.current);
    try {
      localStorage.removeItem(clave);
    } catch {}
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(async () => {
      const resultado = await guardarPoema(datos);
      if (resultado.destino) {
        olvidarBorrador();
        router.push(resultado.destino);
      } else {
        setEstado(resultado);
      }
    });
  }

  const errores = estado.errores ?? {};
  const etiqueta = "block font-mano text-[22px] leading-8 font-semibold text-vino";
  const control =
    "block w-full bg-transparent text-tinta-titulo placeholder:text-tinta-suave/70 focus-visible:outline-offset-2";

  return (
    <>
      <form
        ref={formulario}
        onSubmit={enviar}
        onInput={guardarBorrador}
        noValidate
        className="papel px-6 pt-8 pb-8 [color-scheme:light]"
      >
        {poema && <input type="hidden" name="id" value={poema.id} />}

        <label htmlFor="fecha" className={etiqueta}>
          Fecha
        </label>
        <input
          id="fecha"
          name="fecha"
          type="date"
          required
          max={hoy}
          defaultValue={valoresIniciales.fecha}
          aria-invalid={!!errores.fecha}
          aria-describedby={errores.fecha ? "error-fecha" : undefined}
          className={`${control} h-8 text-[19px] leading-8`}
        />
        <Error id="error-fecha" mensaje={errores.fecha} />

        <label htmlFor="titulo" className={`${etiqueta} mt-8`}>
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          placeholder="Sin título"
          maxLength={200}
          defaultValue={valoresIniciales.titulo}
          aria-invalid={!!errores.titulo}
          aria-describedby={errores.titulo ? "error-titulo" : undefined}
          className={`${control} h-8 text-[22px] leading-8 font-semibold`}
        />
        <Error id="error-titulo" mensaje={errores.titulo} />

        <label htmlFor="texto" className={`${etiqueta} mt-8`}>
          Poema
        </label>
        <textarea
          id="texto"
          name="texto"
          required
          placeholder="Escribe aquí, verso a verso…"
          defaultValue={valoresIniciales.texto}
          aria-invalid={!!errores.texto}
          aria-describedby={errores.texto ? "error-texto" : undefined}
          className={`${control} field-sizing-content min-h-64 resize-none p-0 text-[19px] leading-8`}
        />
        <Error id="error-texto" mensaje={errores.texto} />

        {estado.error && (
          <p role="alert" className="text-vino mt-8 text-[17px] leading-8 font-semibold">
            {estado.error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="submit"
            className="pildora pildora-vino px-6"
            disabled={guardando}
          >
            {guardando
              ? "Guardando…"
              : poema
                ? "Guardar cambios"
                : "Guardar en el diario"}
          </button>
          {poema && cancelar && (
            <Link
              href={cancelar}
              onClick={olvidarBorrador}
              className="pildora border-tinta/30 text-tinta hover:bg-tinta/5"
            >
              Cancelar
            </Link>
          )}
        </div>
      </form>

      <p className="text-secundario mt-5 text-center text-[16px] italic">
        El borrador se guarda solo mientras escribes.
      </p>
    </>
  );
}

function Error({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p id={id} className="text-vino text-[16px] leading-8 font-semibold">
      {mensaje}
    </p>
  );
}
