import { redirect } from "next/navigation";
import { deleteSession } from "@/lib/session";

// /logout is visited by typing the URL, so it has to answer GET:
// a Server Action can't run on navigation.
export async function GET() {
  await deleteSession();
  redirect("/");
}
