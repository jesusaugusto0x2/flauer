"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { contrasenaCorrecta, limpiarIntentos, registrarIntento } from "@/lib/acceso";
import { borrarPoema, crearPoema, editarPoema, esIdValido } from "@/lib/poemas";
import { crearSesion, guardarModo, haySesion } from "@/lib/sesion";
import { esquemaPoema, type CamposPoema, type EstadoFormulario } from "@/lib/validacion";

const SIN_SESION = "Tu sesión expiró. Vuelve a entrar para guardar.";

// ── Acceso ──────────────────────────────────────────────────────────────────

export type EstadoEntrar = { error?: string };

export async function entrar(_: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const { permitido, ip } = await registrarIntento();
  if (!permitido) {
    return { error: "Demasiados intentos. Espera unos minutos y vuelve a probar." };
  }

  const contrasena = datos.get("contrasena");
  if (typeof contrasena !== "string" || !contrasenaCorrecta(contrasena)) {
    return { error: "Esa no es la contraseña." };
  }

  await limpiarIntentos(ip);
  await crearSesion();
  await guardarModo("escritura");
  redirect("/");
}

export async function cambiarModo(datos: FormData) {
  if (!(await haySesion())) return;
  const modo = datos.get("modo");
  if (modo === "lectura" || modo === "escritura") await guardarModo(modo);
}

// ── Poemas ──────────────────────────────────────────────────────────────────

export type ResultadoGuardar = EstadoFormulario & { destino?: string };

export async function guardarPoema(datos: FormData): Promise<ResultadoGuardar> {
  if (!(await haySesion())) return { error: SIN_SESION };

  const valores = {
    fecha: String(datos.get("fecha") ?? ""),
    titulo: String(datos.get("titulo") ?? ""),
    texto: String(datos.get("texto") ?? ""),
  };
  const id = datos.get("id");

  const resultado = esquemaPoema.safeParse(valores);
  if (!resultado.success) {
    const errores: Partial<Record<CamposPoema, string>> = {};
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0] as CamposPoema;
      errores[campo] ??= problema.message;
    }
    return { errores };
  }

  try {
    if (typeof id === "string" && id) {
      if (!esIdValido(id) || !(await editarPoema(id, resultado.data))) {
        return { error: "Ese poema ya no existe." };
      }
    } else {
      await crearPoema(resultado.data);
    }
  } catch (e) {
    console.error(e);
    return { error: "No se pudo guardar. Inténtalo de nuevo." };
  }

  return { destino: `/dia/${resultado.data.fecha}` };
}

export async function eliminarPoema(id: string): Promise<{ error?: string }> {
  if (!(await haySesion())) return { error: SIN_SESION };
  if (!esIdValido(id)) return { error: "Ese poema ya no existe." };

  try {
    await borrarPoema(id);
  } catch (e) {
    console.error(e);
    return { error: "No se pudo borrar. Inténtalo de nuevo." };
  }

  refresh();
  return {};
}
