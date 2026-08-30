import type { HTMLAttributes, ReactNode } from "react";

import { classNames } from "@/components/ui/class-names";

type CardSurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "section" | "div";
  children: ReactNode;
};

export function CardSurface({ as: Element = "article", className, children, ...props }: CardSurfaceProps) {
  return <Element {...props} className={classNames("ui-card-surface", className)}>{children}</Element>;
}
