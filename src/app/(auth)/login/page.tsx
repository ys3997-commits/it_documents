import { AuthLinks, LoginForm } from "@/components/auth-forms";
import { SetupScreen } from "@/components/setup-screen";
import { supabaseEnv } from "@/lib/env";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  if (!supabaseEnv()) return <SetupScreen />;

  return (
    <section className="card p-8">
      <p className="text-sm font-medium text-accent">Records</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 mb-6 text-sm leading-6 text-muted">
        Your tax documents stay private to this account.
      </p>
      <LoginForm />
      <AuthLinks mode="login" />
    </section>
  );
}
