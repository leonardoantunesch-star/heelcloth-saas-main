import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, checked, ...props }, ref) => {
    const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={checkboxId}
            type="checkbox"
            ref={ref}
            checked={checked}
            className={cn(
              "peer h-4.5 w-4.5 shrink-0 appearance-none rounded-md border border-slate-300 bg-white transition-colors cursor-pointer",
              "checked:border-blue-600 checked:bg-blue-600",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-rose-300",
              className
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
        </div>
        {(label || description) && (
          <div className="text-xs">
            {label && (
              <label htmlFor={checkboxId} className="font-medium text-slate-800 cursor-pointer select-none">
                {label}
              </label>
            )}
            {description && <p className="text-slate-500 mt-0.5">{description}</p>}
            {error && <p className="text-rose-600 font-medium mt-0.5">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
