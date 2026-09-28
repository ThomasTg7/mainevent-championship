"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const FORBIDDEN_MESSAGE = "Este correo no tiene acceso";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const { error: signInError } = await authClient.signIn.email({ email, password });

    setPending(false);

    if (signInError) {
      setError(signInError.message === FORBIDDEN_MESSAGE ? FORBIDDEN_MESSAGE : "Correo o contraseña incorrectos");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  async function handleGoogle() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/admin" });
  }

  return (
    <div className="min-h-svh flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
        <Button type="button" variant="outline" onClick={handleGoogle}>
          Continuar con Google
        </Button>
      </div>
    </div>
  );
}
