"use client";

import ModalPortal from "@/components/ModalPortal";

type Props = {
  /** When true, render only children (inside ExpandableSection) — no fullscreen overlay */
  embedded?: boolean;
  children: React.ReactNode;
};

export default function ReportFormContainer({ embedded, children }: Props) {
  if (embedded) {
    return <>{children}</>;
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
        {children}
      </div>
    </ModalPortal>
  );
}
