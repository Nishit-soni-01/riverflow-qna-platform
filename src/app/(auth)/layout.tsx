"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, CheckCircle2, Loader2, Waves } from "lucide-react";
import { useAuthStore } from "@/store/Auth";
import { cn } from "@/lib/utils";

const BRAND = "Riverflow";
const WAVE_PATH =
  "M0 60 C200 20 400 100 600 60 C800 20 1000 100 1200 60 V120 H0 Z";

function Logo({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg shadow-sm",
          onDark ? "bg-white text-emerald-700" : "bg-emerald-600 text-white"
        )}
      >
        <Waves className="size-4" />
      </span>
      {BRAND}
    </Link>
  );
}

/** One looping strip of water. Two copies side by side, shifted by -50% for a seamless drift. */
function WaveLayer({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute bottom-0 left-0 flex w-[200%] motion-reduce:animate-none",
        className
      )}
    >
      {[0, 1].map((i) => (
        <svg
          key={i}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="h-full w-1/2 shrink-0"
        >
          <path d={WAVE_PATH} className="fill-current" />
        </svg>
      ))}
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
      {/* Faint dot texture, fading out toward the water */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_65%)]"
      />

      {/* Flowing river: three layers drifting at different speeds */}
      <WaveLayer className="h-44 text-emerald-300/15 animate-[drift_30s_linear_infinite] [animation-direction:reverse]" />
      <WaveLayer className="h-32 text-emerald-200/15 animate-[drift_20s_linear_infinite]" />
      <WaveLayer className="h-20 text-white/10 animate-[drift_13s_linear_infinite] [animation-direction:reverse]" />

      <Logo onDark className="relative z-10 text-lg" />

      <div className="relative z-10 space-y-8 animate-[rise-in_0.8s_ease-out_both] motion-reduce:animate-none">
        <div className="space-y-3">
          <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
            Ask better questions.
            <br />
            <span className="text-emerald-100/80">Get answers that ship.</span>
          </h2>
          <p className="max-w-md text-pretty text-emerald-50/75">
            A community where developers share knowledge, solve real problems,
            and build reputation for the help they give.
          </p>
        </div>

        {/* Sample question, gently floating */}
        <div className="max-w-md animate-[bob_6s_ease-in-out_infinite] motion-reduce:animate-none">
          <div className="rounded-xl bg-white p-4 text-zinc-900 shadow-2xl shadow-emerald-950/40">
            <div className="flex gap-3">
              <div className="flex flex-col items-center gap-1 text-zinc-400">
                <ArrowUp className="size-4" />
                <span className="text-sm font-semibold text-zinc-900">128</span>
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-sm font-medium">
                  How do I debounce an input in React without re-renders?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["react", "typescript", "hooks"].map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  Accepted answer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static year: Next.js 16 Cache Components rejects new Date() in client components */}
      <p className="relative z-10 text-sm text-emerald-100/60">
        © 2026 {BRAND}. Built for developers.
      </p>
    </aside>
  );
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);

  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <main className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-500/10 to-transparent lg:hidden"
        />
        <Logo className="relative mb-10 text-lg lg:hidden" />
        <div className="relative w-full max-w-md">{children}</div>
      </main>
    </div>
  );
};

export default Layout;