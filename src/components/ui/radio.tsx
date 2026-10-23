import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const radioId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={radioId}
            type="radio"
            ref={ref}
            className={cn(
              "peer h-4.5 w-4.5 shrink-0 appearance-none rounded-full border border-slate-300 bg-white transition-colors cursor-pointer",
              "checked:border-blue-600 checked:border-[5px]",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-rose-300",
              className
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="text-xs">
            {label && (
              <label htmlFor={radioId} className="font-medium text-slate-800 cursor-pointer select-none">
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
Radio.displayName = "Radio";
