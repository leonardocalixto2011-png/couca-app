import Image from "next/image";

/** Product image, or a branded gradient placeholder with the name. */
export function ProductArt({
  images,
  name,
  className = "",
}: {
  images: string[];
  name: string;
  className?: string;
}) {
  if (images[0]) {
    return (
      <div className={`relative aspect-square overflow-hidden ${className}`}>
        <Image src={images[0]} alt={name} fill className="object-cover" sizes="(max-width:700px) 100vw, 400px" />
      </div>
    );
  }
  return (
    <div
      className={`grid aspect-square place-items-center bg-gradient-to-br from-[color-mix(in_srgb,var(--color-gold)_28%,var(--color-cream))] to-blush p-6 text-center ${className}`}
    >
      <span className="font-display text-[1.4rem] font-semibold text-terracotta">{name}</span>
    </div>
  );
}
