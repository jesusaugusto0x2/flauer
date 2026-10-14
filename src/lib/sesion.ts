import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { COOKIE_MODO, COOKIE_SESION, DURACION_SESION_DIAS } from "./config";

export type Modo = "lectura" | "escritura";

const DURACION_SEGUNDOS = DURACION_SESION_DIAS * 24 * 60 * 60;

function clave() {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error("AUTH_SECRET debe existir y tener al menos 32 caracteres.");
  }
  return new TextEncoder().encode(secreto);
}

export async function crearSesion() {
  const token = await new SignJWT({ rol: "duena" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("duena")
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_DIAS}d`)
    .sign(clave());

  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

export async function borrarSesion() {
  const almacen = await cookies();
  almacen.delete(COOKIE_SESION);
  almacen.delete(COOKIE_MODO);
}

/** true si hay una cookie de sesión válida y firmada. */
export async function haySesion(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ["HS256"] });
    return payload.sub === "duena";
  } catch {
    return false;
  }
}

/** Modo de la interfaz. Sin sesión siempre es lectura. */
export async function modoActual(): Promise<{ sesion: boolean; modo: Modo }> {
  const sesion = await haySesion();
  if (!sesion) return { sesion, modo: "lectura" };
  const valor = (await cookies()).get(COOKIE_MODO)?.value;
  return { sesion, modo: valor === "escritura" ? "escritura" : "lectura" };
}

export async function guardarModo(modo: Modo) {
  (await cookies()).set(COOKIE_MODO, modo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}
