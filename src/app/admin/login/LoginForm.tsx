"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Icon } from "@/components/Icon";

export function LoginForm({ from, initialError }: { from?: string; initialError?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ? "Connexion échouée." : null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Courriel ou mot de passe invalide.");
        return;
      }
      router.push(from && from.startsWith("/admin") ? from : "/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-ui text-[0.8rem] font-semibold text-ink-soft">Courriel</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-[var(--radius-lg)] border border-line bg-white px-3.5 py-2.5 text-[0.95rem] focus-visible:border-gold-muted"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-ui text-[0.8rem] font-semibold text-ink-soft">Mot de passe</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[var(--radius-lg)] border border-line bg-white px-3.5 py-2.5 text-[0.95rem] focus-visible:border-gold-muted"
        />
      </label>
      {error && <p className="text-sm text-terracotta">{error}</p>}
      <button type="submit" disabled={pending} className="btn">
        <Icon name="check" />
        {pending ? "…" : "Se connecter"}
      </button>
    </form>
  );
}
