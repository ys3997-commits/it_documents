"use server";

import { redirect } from "next/navigation";
import { supabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/types/records";

export async function signIn(formData: FormData): Promise<ActionResult> {
  if (!supabaseEnv()) return { ok: false, error: "Supabase is not configured." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/confirm/i.test(error.message)) {
      return { ok: false, error: "Confirm your email, then sign in." };
    }
    return { ok: false, error: "Email or password is incorrect." };
  }

  redirect("/");
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  if (!supabaseEnv()) return { ok: false, error: "Supabase is not configured." };

  const displayName = String(formData.get("displayName") ?? "").trim().replace(/\s+/g, " ");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (displayName.length < 2 || displayName.length > 80) {
    return { ok: false, error: "Enter your name." };
  }
  if (!email.includes("@")) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8) return { ok: false, error: "Use at least 8 characters." };
  if (password !== confirm) return { ok: false, error: "Passwords do not match." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    if (/already/i.test(error.message)) {
      return { ok: false, error: "An account with this email already exists." };
    }
    return { ok: false, error: "Could not create the account. Try again." };
  }

  if (!data.session) {
    return {
      ok: false,
      tone: "info",
      error: "Check your email to confirm the account, then sign in.",
    };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
