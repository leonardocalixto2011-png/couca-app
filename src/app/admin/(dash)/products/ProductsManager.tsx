"use client";

import { useState, useTransition } from "react";
import { createProduct, updateProduct, deleteProduct } from "@/app/admin/actions";

type P = {
  slug: string;
  nameFr: string;
  nameEn: string;
  descriptionFr: string;
  descriptionEn: string;
  priceDollars: number;
  active: boolean;
  imagesCsv: string;
  optionsJson: string;
};

const BLANK: Omit<P, "slug"> = {
  nameFr: "",
  nameEn: "",
  descriptionFr: "",
  descriptionEn: "",
  priceDollars: 0,
  active: true,
  imagesCsv: "",
  optionsJson: "[]",
};

export function ProductsManager({ products }: { products: P[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {products.map((p) => (
        <ProductForm key={p.slug} initial={p} slug={p.slug} />
      ))}

      {creating ? (
        <ProductForm initial={{ ...BLANK }} onDone={() => setCreating(false)} />
      ) : (
        <button type="button" onClick={() => setCreating(true)} className="btn btn--ghost btn--sm self-start">
          + Nouveau produit
        </button>
      )}
    </div>
  );
}

function ProductForm({
  initial,
  slug,
  onDone,
}: {
  initial: Omit<P, "slug"> & Partial<Pick<P, "slug">>;
  slug?: string;
  onDone?: () => void;
}) {
  const [f, setF] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (p: Partial<typeof f>) => setF((v) => ({ ...v, ...p }));

  function save() {
    setMsg(null);
    start(async () => {
      try {
        const payload = {
          nameFr: f.nameFr,
          nameEn: f.nameEn,
          descriptionFr: f.descriptionFr,
          descriptionEn: f.descriptionEn,
          priceDollars: Number(f.priceDollars),
          active: f.active,
          imagesCsv: f.imagesCsv,
          optionsJson: f.optionsJson,
        };
        if (slug) await updateProduct(slug, payload);
        else {
          await createProduct(payload);
          onDone?.();
        }
        setMsg("Enregistré ✓");
        setTimeout(() => setMsg(null), 1500);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Erreur");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom (FR)" value={f.nameFr} onChange={(v) => set({ nameFr: v })} />
        <Field label="Nom (EN)" value={f.nameEn} onChange={(v) => set({ nameEn: v })} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-1.5 text-[0.85rem]">
          <span className="text-ink-faint">Prix $</span>
          <input
            type="number"
            min={0}
            step={1}
            value={f.priceDollars}
            onChange={(e) => set({ priceDollars: Number(e.target.value) })}
            className="w-[80px] rounded-[var(--radius-lg)] border border-line px-2 py-1 text-right"
          />
        </label>
        <label className="flex items-center gap-1.5 text-[0.85rem]">
          <input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} />
          En ligne
        </label>
        {slug && <span className="text-[0.72rem] text-ink-faint">/{slug}</span>}
      </div>
      <Area label="Description (FR)" value={f.descriptionFr} onChange={(v) => set({ descriptionFr: v })} />
      <Area label="Description (EN)" value={f.descriptionEn} onChange={(v) => set({ descriptionEn: v })} />
      <Field
        label="Images (URLs séparées par des virgules)"
        value={f.imagesCsv}
        onChange={(v) => set({ imagesCsv: v })}
      />
      <Area
        label="Options (JSON — laisser [] si aucune)"
        value={f.optionsJson}
        onChange={(v) => set({ optionsJson: v })}
        mono
      />
      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="btn btn--sm">
          {slug ? "Enregistrer" : "Créer"}
        </button>
        {slug && (
          <button
            type="button"
            onClick={() => start(() => deleteProduct(slug))}
            className="text-[0.8rem] text-terracotta underline underline-offset-2"
          >
            Supprimer
          </button>
        )}
        {msg && <span className="text-[0.8rem] text-ink-soft">{msg}</span>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-[0.8rem]">
      <span className="font-semibold text-ink-soft">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[var(--radius-lg)] border border-line px-2.5 py-1.5 text-[0.9rem]"
      />
    </label>
  );
}
function Area({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-[0.8rem]">
      <span className="font-semibold text-ink-soft">{label}</span>
      <textarea
        value={value}
        rows={mono ? 4 : 3}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-[var(--radius-lg)] border border-line px-2.5 py-1.5 text-[0.88rem] ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}
