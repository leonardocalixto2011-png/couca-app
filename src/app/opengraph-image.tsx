import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Couca & Co. Beauty — Nail Studio · Montréal, Laval & Rive-Nord";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const photo = await readFile(join(process.cwd(), "public/img/web-4.jpg"));
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #F3D8D0 0%, #FAF8F5 60%)",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "620px",
            padding: "84px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 7,
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
              marginTop: 26,
              fontSize: 78,
              lineHeight: 1.08,
              color: "#2D2B2A",
            }}
          >
            Des ongles qui font toute la différence.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 34,
              fontSize: 27,
              color: "#6F5F5B",
              fontFamily: "sans-serif",
            }}
          >
            Montréal, Laval &amp; Rive-Nord · coucabeauty.ca
          </div>
        </div>
        <div style={{ display: "flex", width: "580px", height: "100%" }}>
          <img
            src={photoSrc}
            width={580}
            height={630}
            style={{ objectFit: "cover", width: "580px", height: "630px" }}
          />
        </div>
      </div>
    ),
    size,
  );
}
