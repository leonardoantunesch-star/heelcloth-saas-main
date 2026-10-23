import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, checked, onCheckedChange, onChange, id, disabled, ...props }, ref) => {
    const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e);
      if (onCheckedChange) onCheckedChange(e.target.checked);
    };

    return (
      <div className="flex items-center justify-between gap-3">
        {(label || description) && (
          <div className="text-xs">
            {label && (
              <label htmlFor={switchId} className="font-medium text-slate-800 cursor-pointer select-none">
                {label}
              </label>
            )}
            {description && <p className="text-slate-500 mt-0.5">{description}</p>}
          </div>
        )}
        <label
          htmlFor={switchId}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
            checked ? "bg-blue-600" : "bg-slate-300",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
        >
          <input
            id={switchId}
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <span
            className={cn(
              "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs transition-transform",
              checked ? "translate-x-5.5" : "translate-x-1"
            )}
          />
        </label>
      </div>
    );
  }
);
Switch.displayName = "Switch";
