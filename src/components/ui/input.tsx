import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, startIcon, endIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {startIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors shadow-2xs",
              "placeholder:text-slate-400",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-600",
              "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
              error ? "border-rose-300 focus-visible:ring-rose-200 focus-visible:border-rose-500" : "border-slate-300",
              startIcon && "pl-9",
              endIcon && "pr-9",
              className
            )}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center justify-center">
              {endIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-rose-600">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
