import type { ButtonHTMLAttributes, ReactNode } from "react";

import { classNames } from "@/components/ui/class-names";

type ButtonVariant = "primary" | "secondary" | "ghost";

type AccessibleIconButton = {
  iconOnly: true;
  "aria-label": string;
};

type TextButton = {
  iconOnly?: false;
  "aria-label"?: string;
};

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> &
  (AccessibleIconButton | TextButton) & {
    variant?: ButtonVariant;
    loading?: boolean;
    loadingLabel?: string;
    children?: ReactNode;
  };

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel = "処理中",
  iconOnly = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={classNames("ui-button", `ui-button--${variant}`, iconOnly && "ui-button--icon", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : null}
      <span className={iconOnly ? "ui-visually-hidden" : undefined}>{loading ? loadingLabel : children}</span>
      {iconOnly && !loading ? <span aria-hidden="true">{children}</span> : null}
    </button>
  );
}
