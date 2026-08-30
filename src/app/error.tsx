"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="section-pad">
      <div className="container-x mx-auto max-w-[480px] text-center">
        <span className="eyebrow justify-center">Couca &amp; Co. Beauty</span>
        <h1 className="mt-4 text-[clamp(2rem,1.5rem+2.5vw,3rem)]">Une erreur est survenue</h1>
        <p className="mx-auto mt-3 max-w-[38ch] text-ink-soft">
          Désolée, quelque chose a mal tourné. Réessayez, ou revenez à l&rsquo;accueil.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn">
            Réessayer
          </button>
          <a href="/" className="btn btn--ghost">
            Accueil
          </a>
        </div>
      </div>
    </section>
  );
}
