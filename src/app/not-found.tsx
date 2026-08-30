import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section-pad">
      <div className="container-x mx-auto max-w-[480px] text-center">
        <span className="eyebrow justify-center">Couca &amp; Co. Beauty</span>
        <h1 className="mt-4 text-[clamp(2.2rem,1.6rem+3vw,3.4rem)]">Page introuvable</h1>
        <p className="mx-auto mt-3 max-w-[36ch] text-ink-soft">
          Ce lien ne mène nulle part. Retour à l&rsquo;accueil ?
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn">
            Accueil
          </Link>
          <Link href="/reserver" className="btn btn--ghost">
            Réserver
          </Link>
        </div>
      </div>
    </section>
  );
}
