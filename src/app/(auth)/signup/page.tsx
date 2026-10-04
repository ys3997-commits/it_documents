import { AuthLinks, SignupForm } from "@/components/auth-forms";
import { SetupScreen } from "@/components/setup-screen";
import { supabaseEnv } from "@/lib/env";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  if (!supabaseEnv()) return <SetupScreen />;

  return (
    <section className="card p-8">
      <p className="text-sm font-medium text-accent">Records</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-2 mb-6 text-sm leading-6 text-muted">
        A private place for your income-tax documents.
      </p>
      <SignupForm />
      <AuthLinks mode="signup" />
    </section>
  );
}
