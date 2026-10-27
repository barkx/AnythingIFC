import { LogoMark } from "@ifcwise/ui";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-float">
        <LogoMark className="size-10" />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Review projects and deliver models.</p>
        <LoginForm />
      </div>
    </main>
  );
}
