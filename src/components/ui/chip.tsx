import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { classNames } from "@/components/ui/class-names";

type ChipTone = "neutral" | "accent" | "positive";

export type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
  children: ReactNode;
};

export function Chip({ tone = "neutral", className, children, ...props }: ChipProps) {
  return <span {...props} className={classNames("ui-chip", `ui-chip--${tone}`, className)}>{children}</span>;
}

export type SelectableChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
  children?: ReactNode;
};

export function SelectableChip({ selected, className, children, ...props }: SelectableChipProps) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      className={classNames("ui-selectable-chip", selected && "is-selected", className)}
      aria-pressed={selected}
    >
      {children}
    </button>
  );
}
