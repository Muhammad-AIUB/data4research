"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Renders children into document.body so fixed overlays escape ancestor overflow/backdrop-filter. */
export default function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
