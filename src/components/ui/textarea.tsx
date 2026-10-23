import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors shadow-2xs resize-y",
            "placeholder:text-slate-400",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-600",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
            error ? "border-rose-300 focus-visible:ring-rose-200 focus-visible:border-rose-500" : "border-slate-300",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-rose-600">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
