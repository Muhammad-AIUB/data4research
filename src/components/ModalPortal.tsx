"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noopSubscribe = () => () => {};

/** Renders children into document.body so fixed overlays escape ancestor overflow/backdrop-filter. */
export default function ModalPortal({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
