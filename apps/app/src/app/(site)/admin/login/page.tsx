import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <LoginForm />
    </main>
  );
}
