import { redirect } from "next/navigation";
import { borrarSesion } from "@/lib/sesion";

// /salir se visita escribiendo la URL, así que necesita responder a GET:
// una Server Action no se ejecuta al navegar.
export async function GET() {
  await borrarSesion();
  redirect("/");
}
