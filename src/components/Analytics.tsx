"use client";

import { useEffect } from "react";
import Script from "next/script";

const GA = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const ADS = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const ADS_BOOKING_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL;
const ADS_ORDER_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_ORDER_LABEL;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Google tag (GA4 + Google Ads). Renders nothing until the IDs are set in Vercel. */
export function Analytics() {
  const primary = GA ?? ADS;
  if (!primary) return null;
  const configs = [GA && `gtag('config','${GA}');`, ADS && `gtag('config','${ADS}');`].filter(Boolean).join("");
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${primary}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${configs}`}
      </Script>
    </>
  );
}

function fireOnce(key: string, fn: () => void) {
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* private mode — fire anyway */
  }
  fn();
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if (window.gtag) window.gtag(...args);
  else (window.dataLayer ??= []).push(args);
}

/** Fired once per booking on the confirmation page — this is what makes a Google Ad measurable. */
export function TrackBookingConversion({ reference, valueCents }: { reference: string; valueCents: number }) {
  useEffect(() => {
    if (!GA && !ADS) return;
    fireOnce(`couca-conv-booking-${reference}`, () => {
      const value = valueCents / 100;
      gtag("event", "generate_lead", { currency: "CAD", value, transaction_id: reference });
      if (ADS && ADS_BOOKING_LABEL) {
        gtag("event", "conversion", { send_to: `${ADS}/${ADS_BOOKING_LABEL}`, value, currency: "CAD", transaction_id: reference });
      }
    });
  }, [reference, valueCents]);
  return null;
}

export function TrackOrderConversion({ reference, valueCents }: { reference: string; valueCents: number }) {
  useEffect(() => {
    if (!GA && !ADS) return;
    fireOnce(`couca-conv-order-${reference}`, () => {
      const value = valueCents / 100;
      gtag("event", "purchase", { currency: "CAD", value, transaction_id: reference });
      if (ADS && ADS_ORDER_LABEL) {
        gtag("event", "conversion", { send_to: `${ADS}/${ADS_ORDER_LABEL}`, value, currency: "CAD", transaction_id: reference });
      }
    });
  }, [reference, valueCents]);
  return null;
}
