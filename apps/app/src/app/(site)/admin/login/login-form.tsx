"use client";

import { useActionState } from "react";
import { Button, ErrorText, Field, inputClass } from "@/components/ui";
import { login } from "@/lib/admin-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <Field label="Password">
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </Field>
      {state.error && <ErrorText>{state.error}</ErrorText>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Checking…" : "Log in"}
      </Button>
    </form>
  );
}
