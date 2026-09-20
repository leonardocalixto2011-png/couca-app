"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { uploadInspoPhoto } from "@/app/reserver/upload";
import { Icon } from "@/components/Icon";

const MAX_PHOTOS = 3;
const MAX_EDGE = 1400;

/** Downscale to ≤1400px JPEG in the browser so uploads stay small on mobile data. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.82),
  );
}

export function InspoUpload({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(list: FileList | null) {
    if (!list || !list.length) return;
    setError(null);
    setBusy(true);
    const next = [...urls];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_PHOTOS) break;
      try {
        const blob = await shrink(file);
        const fd = new FormData();
        fd.append("file", new File([blob], "inspo.jpg", { type: "image/jpeg" }));
        const res = await uploadInspoPhoto(fd);
        if (res.ok) next.push(res.url);
        else setError(t("book.inspoError"));
      } catch {
        setError(t("book.inspoError"));
      }
    }
    onChange(next);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="font-ui text-[0.8rem] font-semibold text-ink-soft">{t("book.inspoLabel")}</span>
      <p className="text-[0.82rem] text-ink-faint">{t("book.inspoHelp")}</p>

      {urls.length > 0 && (
        <ul className="flex flex-wrap gap-2.5">
          {urls.map((u) => (
            <li key={u} className="relative h-[92px] w-[92px] overflow-hidden rounded-[var(--radius-lg)] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(urls.filter((x) => x !== u))}
                aria-label={t("book.inspoRemove")}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-charcoal/80 text-cream"
              >
                <Icon name="close" className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {urls.length < MAX_PHOTOS && (
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-dashed border-gold-muted px-4 py-2 text-[0.88rem] text-ink-soft hover:border-terracotta hover:text-terracotta">
          <Icon name="spark" className="h-4 w-4 text-gold" />
          {busy ? t("book.inspoUploading") : t("book.inspoAdd")}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={(e) => handleFiles(e.target.files)}
            className="sr-only"
          />
        </label>
      )}

      {error && <p className="text-[0.82rem] text-terracotta">{error}</p>}
    </div>
  );
}
