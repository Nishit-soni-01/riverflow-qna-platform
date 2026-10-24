"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/Auth";
import { useRouter } from "next/navigation";

type Values = { email: string; password: string };
type Errors = Partial<Record<keyof Values, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.email.trim()) e.email = "Enter your email address.";
  else if (!EMAIL_RE.test(v.email)) e.email = "Enter a valid email address.";
  if (!v.password) e.password = "Enter your password.";
  return e;
}

export default function Login() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [values, setValues] = React.useState<Values>({ email: "", password: "" });
  const [touched, setTouched] = React.useState<Partial<Record<keyof Values, boolean>>>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const errors = validate(values);
  const visible = (k: keyof Values) => (touched[k] ? errors[k] : undefined);

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


const handleSubmit = async (
  e: React.SyntheticEvent<HTMLFormElement>
) => {
  e.preventDefault();

  setTouched({ email: true, password: true });

  const firstInvalid = (
    Object.keys(errors) as (keyof Values)[]
  )[0];

  if (firstInvalid) {
    document.getElementById(firstInvalid)?.focus();
    return;
  }

  if (isLoading) return;

  setIsLoading(true);
  setError("");

  try {
    const response = await login(
      values.email.trim(),
      values.password
    );

    if (!response.success) {
      setError(
        response.error?.message ??
          "Unable to log in. Check your email and password, or sign out of the current session first."
      );
      return;
    }

    router.replace("/");
    router.refresh();
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
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Log in to Riverflow to pick up where you left off.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Wire these to account.createOAuth2Session() when OAuth is configured in Appwrite */}
        <Button type="button" variant="outline" disabled title="Coming soon">
          <IconBrandGoogle className="size-4" />
          Google
        </Button>
        <Button type="button" variant="outline" disabled title="Coming soon">
          <IconBrandGithub className="size-4" />
          GitHub
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or log in with email
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
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            {...inputProps("email")}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
          {visible("email") && (
            <p id="email-error" className="text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              {...inputProps("password")}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
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
          {visible("password") && (
            <p id="password-error" className="text-xs text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          {isLoading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to Riverflow?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}