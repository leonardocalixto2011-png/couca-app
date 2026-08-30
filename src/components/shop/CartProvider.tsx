"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  slug: string;
  qty: number;
  selected: Record<string, string>; // option nameFr -> value
  // display snapshot (server re-validates price at checkout)
  nameFr: string;
  nameEn: string;
  priceCents: number;
  optionLabelsFr: Record<string, string>;
  optionLabelsEn: Record<string, string>;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  add: (item: CartItem) => void;
  setQty: (index: number, qty: number) => void;
  remove: (index: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "couca-cart";

function sameLine(a: CartItem, b: CartItem) {
  return a.slug === b.slug && JSON.stringify(a.selected) === JSON.stringify(b.selected);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => sameLine(p, item));
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(20, next[i].qty + item.qty) };
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const setQty = useCallback((index: number, qty: number) => {
    setItems((prev) =>
      prev.map((p, i) => (i === index ? { ...p, qty: Math.max(1, Math.min(20, qty)) } : p)),
    );
  }, []);

  const remove = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotalCents: items.reduce((s, i) => s + i.priceCents * i.qty, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
