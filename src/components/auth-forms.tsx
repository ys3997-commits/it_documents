"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn, signUp } from "@/actions/auth";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await signIn(new FormData(event.currentTarget));
        if (result && !result.ok) {
          setError(result.error);
          setPending(false);
        }
      }}
    >
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Password" name="password" type="password" autoComplete="current-password" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button className="btn btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function SignupForm() {
  const [message, setMessage] = useState<{ text: string; tone: "error" | "info" } | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setMessage(null);
        const result = await signUp(new FormData(event.currentTarget));
        if (result && !result.ok) {
          setMessage({ text: result.error, tone: result.tone === "info" ? "info" : "error" });
          setPending(false);
        }
      }}
    >
      <Field label="Name" name="displayName" autoComplete="name" />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Password" name="password" type="password" autoComplete="new-password" />
      <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" />
      {message ? (
        <p className={message.tone === "info" ? "text-sm text-zinc-700" : "text-sm text-danger"}>
          {message.text}
        </p>
      ) : null}
      <button className="btn btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="field" name={name} type={type} autoComplete={autoComplete} required />
    </label>
  );
}

export function AuthLinks({ mode }: { mode: "login" | "signup" }) {
  if (mode === "login") {
    return (
      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-accent">
          Create an account
        </Link>
      </p>
    );
  }

  return (
    <p className="mt-6 text-center text-sm text-muted">
      Already have an account?{" "}
      <Link href="/login" className="font-medium text-accent">
        Sign in
      </Link>
    </p>
  );
}
