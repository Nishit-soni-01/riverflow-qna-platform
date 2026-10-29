"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/Auth";
import { cn } from "@/lib/utils";
import { OAuthProvider } from "appwrite";

type Values = {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
};
type Errors = Partial<Record<keyof Values, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.firstname.trim()) e.firstname = "Enter your first name.";
  if (!v.lastname.trim()) e.lastname = "Enter your last name.";
  if (!v.email.trim()) e.email = "Enter your email address.";
  else if (!EMAIL_RE.test(v.email)) e.email = "Enter a valid email address.";
  if (!v.password) e.password = "Create a password.";
  else if (v.password.length < 8)
    e.password = "Use at least 8 characters.";
  return e;
}

function passwordScore(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
  return s; // 0-4
}

const STRENGTH = [
  { label: "Too short", bar: "bg-destructive" },
  { label: "Weak", bar: "bg-destructive" },
  { label: "Fair", bar: "bg-amber-500" },
  { label: "Good", bar: "bg-emerald-500" },
  { label: "Strong", bar: "bg-emerald-500" },
];

function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint
      )}
    </div>
  );
}

export default function Register() {
  const { login, createAccount, loginWithOAuth } = useAuthStore();

  const [values, setValues] = React.useState<Values>({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
  });
  const [touched, setTouched] = React.useState<Partial<Record<keyof Values, boolean>>>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const errors = validate(values);
  const visible = (k: keyof Values) => (touched[k] ? errors[k] : undefined);
  const score = passwordScore(values.password);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) =>
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  const inputProps = (name: keyof Values) => ({
    id: name,
    name,
    value: values[name],
    onChange,
    onBlur,
    disabled: isLoading,
    "aria-invalid": !!visible(name),
    "aria-describedby": visible(name) ? `${name}-error` : undefined,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({
      firstname: true,
      lastname: true,
      email: true,
      password: true,
    });

    const currentErrors = validate(values);
    const firstInvalid = (
      Object.keys(currentErrors) as (keyof Values)[]
    )[0];

    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { account } = await import("@/models/client/config");

      let existingSession = false;

      try {
        await account.get();
        existingSession = true;
      } catch {
        // No active session, so registration can continue.
      }

      if (existingSession) {
        setError(
          "You are already logged in. Please log out before creating another account."
        );
        return;
      }

      const response = await createAccount(
        `${values.firstname.trim()} ${values.lastname.trim()}`,
        values.email.trim(),
        values.password
      );

      if (!response.success) {
        setError(
          response.error?.message ?? "Unable to create your account."
        );
        return;
      }

      const loginResponse = await login(
        values.email.trim(),
        values.password
      );

      if (!loginResponse.success) {
        setError(
          loginResponse.error?.message ??
            "Your account was created, but automatic login failed. Please log in."
        );
        return;
      }
    } catch {
      setError(
        "Something went wrong. Check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join Riverflow to ask questions, share answers and build your
          reputation.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => loginWithOAuth(OAuthProvider.Google)}
          disabled={isLoading}
        >
          <IconBrandGoogle className="size-4" />
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => loginWithOAuth(OAuthProvider.Github)}
          disabled={isLoading}
        >
          <IconBrandGithub className="size-4" />
          GitHub
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or sign up with email
        <span className="h-px flex-1 bg-border" />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="firstname" label="First name" error={visible("firstname")}>
            <Input
              {...inputProps("firstname")}
              type="text"
              autoComplete="given-name"
              placeholder="Ada"
            />
          </Field>
          <Field id="lastname" label="Last name" error={visible("lastname")}>
            <Input
              {...inputProps("lastname")}
              type="text"
              autoComplete="family-name"
              placeholder="Lovelace"
            />
          </Field>
        </div>

        <Field id="email" label="Email address" error={visible("email")}>
          <Input
            {...inputProps("email")}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>

        <Field
          id="password"
          label="Password"
          error={visible("password")}
          hint={
            values.password ? (
              <div className="space-y-1.5 pt-0.5" aria-live="polite">
                <div className="flex gap-1" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full bg-muted transition-colors",
                        i < score && STRENGTH[score].bar
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Password strength: {STRENGTH[score].label}
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Use at least 8 characters.
              </p>
            )
          }
        >
          <div className="relative">
            <Input
              {...inputProps("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}