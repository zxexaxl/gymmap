"use client";

import { useLinkStatus } from "next/link";

type PendingFilterLinkLabelProps = {
  label: string;
  countLabel: string;
};

export function PendingFilterLinkLabel({ label, countLabel }: PendingFilterLinkLabelProps) {
  const { pending } = useLinkStatus();

  return (
    <strong
      className={`pending-filter-link-label${pending ? " is-pending" : ""}`}
      aria-busy={pending}
      aria-live="polite"
    >
      {pending ? (
        <>
          <i className="link-loading-spinner" aria-hidden="true" />
          読み込み中…
        </>
      ) : (
        <>
          {label} <span>{countLabel}</span>
        </>
      )}
    </strong>
  );
}
