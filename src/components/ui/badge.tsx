import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "@/components/ui/class-names";

type BadgeTone = "neutral" | "accent" | "success" | "warning";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children: ReactNode;
};

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return <span {...props} className={classNames("ui-badge", `ui-badge--${tone}`, className)}>{children}</span>;
}
