"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useLocale } from "@/i18n/LocaleProvider";
import { Icon } from "@/components/Icon";
import { registerCustomer } from "./actions";
import { cn } from "@/lib/utils";

const ERR: Record<string, { fr: string; en: string }> = {
  BAD_CREDENTIALS: { fr: "Courriel ou mot de passe invalide.", en: "Invalid email or password." },
  NAME_REQUIRED: { fr: "Le nom est requis.", en: "Name is required." },
  BAD_EMAIL: { fr: "Courriel invalide.", en: "Invalid email." },
  WEAK_PASSWORD: { fr: "Au moins 8 caractères.", en: "At least 8 characters." },
  EMAIL_TAKEN: { fr: "Un compte existe déjà pour ce courriel.", en: "An account already exists for this email." },
};

export function AuthForms({
  from,
  initialMode,
}: {
  from?: string;
  initialMode: "login" | "register";
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const dest = from && from.startsWith("/") && !from.startsWith("/connexion") ? from : "/compte";
  const msg = (code: string) => (locale === "fr" ? ERR[code]?.fr : ERR[code]?.en) ?? code;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      if (mode === "register") {
        const res = await registerCustomer({ name, email, password });
        if (!res.ok) {
          setError(msg(res.error));
          return;
        }
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError(msg("BAD_CREDENTIALS"));
        return;
      }
      router.push(dest);
      router.refresh();
    });
  }

  return (
    <div>
      <span className="eyebrow">Couca &amp; Co. Beauty</span>
      <h1 className="mt-3 text-[clamp(1.8rem,1.4rem+2vw,2.6rem)]">
        {mode === "login" ? t("acc.loginTitle") : t("acc.registerTitle")}
      </h1>

      <div className="mt-4 flex gap-2">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-[0.82rem]",
              mode === m ? "border-charcoal bg-charcoal text-cream" : "border-line text-ink-soft",
            )}
          >
            {m === "login" ? t("acc.tabLogin") : t("acc.tabRegister")}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        {mode === "register" && (
          <Field label={t("book.name")} value={name} onChange={setName} autoComplete="name" required />
        )}
        <Field label={t("book.email")} value={email} onChange={setEmail} type="email" autoComplete="email" required />
        <Field
          label={t("acc.password")}
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
        {error && <p className="text-sm text-terracotta">{error}</p>}
        <button type="submit" disabled={pending} className="btn">
          <Icon name="check" />
          {pending ? "…" : mode === "login" ? t("acc.loginBtn") : t("acc.registerBtn")}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.8rem] font-semibold text-ink-soft">
        {label}
        {required && <span className="text-terracotta"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[var(--radius-lg)] border border-line bg-white px-3.5 py-2.5 text-[0.95rem] focus-visible:border-gold-muted"
      />
    </label>
  );
}
