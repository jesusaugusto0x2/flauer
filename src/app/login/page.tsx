import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Loading } from "@/components/loading";
import { hasSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="pt-16">
      <h1 className="font-hand text-center text-[46px] leading-tight font-semibold">
        Entrar
      </h1>
      <Suspense fallback={<Loading />}>
        <Login />
      </Suspense>
    </main>
  );
}

async function Login() {
  await connection();
  if (await hasSession()) redirect("/");
  return <LoginForm />;
}
