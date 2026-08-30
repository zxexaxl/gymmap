import type { HTMLAttributes } from "react";

import { classNames } from "@/components/ui/class-names";

export type FreshnessPresentationStatus = "current" | "aging" | "stale" | "warning" | "neutral";

export type FreshnessIndicatorProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  status: FreshnessPresentationStatus;
  label: string;
};

export function FreshnessIndicator({ status, label, className, ...props }: FreshnessIndicatorProps) {
  return (
    <span {...props} className={classNames("ui-freshness", `ui-freshness--${status}`, className)}>
      <span className="ui-freshness__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
