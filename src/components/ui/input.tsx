import type { InputHTMLAttributes } from "react";

import { classNames } from "@/components/ui/class-names";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  id: string;
  label: string;
  helperText?: string;
  errorText?: string;
};

export function Input({ id, label, helperText, errorText, className, disabled, ...props }: InputProps) {
  const descriptionId = errorText ? `${id}-error` : helperText ? `${id}-helper` : undefined;

  return (
    <label className={classNames("ui-field", disabled && "ui-field--disabled")} htmlFor={id}>
      <span className="ui-field__label">{label}</span>
      <input
        {...props}
        id={id}
        className={classNames("ui-input", className)}
        disabled={disabled}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={descriptionId}
      />
      {errorText ? <span className="ui-field__message ui-field__message--error" id={descriptionId}>{errorText}</span> : null}
      {!errorText && helperText ? <span className="ui-field__message" id={descriptionId}>{helperText}</span> : null}
    </label>
  );
}
