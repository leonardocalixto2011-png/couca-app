import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Couca & Co. Beauty — Nail Studio Montréal & L'Assomption";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "linear-gradient(135deg, #F3D8D0 0%, #FAF8F5 60%)",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#9E4B50",
            fontFamily: "sans-serif",
            fontWeight: 600,
          }}
        >
          COUCA &amp; CO. BEAUTY — NAIL STUDIO
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 88,
            lineHeight: 1.08,
            color: "#2D2B2A",
            maxWidth: 940,
          }}
        >
          Des ongles qui font toute la différence.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 30,
            color: "#6F5F5B",
            fontFamily: "sans-serif",
          }}
        >
          Montréal / L&apos;Assomption · coucabeauty.ca
        </div>
      </div>
    ),
    size,
  );
}
