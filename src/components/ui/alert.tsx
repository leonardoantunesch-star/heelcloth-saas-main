import * as React from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  onClose?: () => void;
}

export function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className,
  ...props
}: AlertProps) {
  const icons = {
    info: <Info className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />,
    danger: <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />,
  };

  const variantStyles = {
    info: "bg-blue-50/60 border-blue-200 text-blue-900",
    success: "bg-emerald-50/60 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50/60 border-amber-200 text-amber-900",
    danger: "bg-rose-50/60 border-rose-200 text-rose-900",
  }[variant];

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 rounded-xl border p-3.5 text-xs transition-all",
        variantStyles,
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 pr-2">
        {title && <h5 className="font-bold leading-tight mb-0.5">{title}</h5>}
        <div className="text-slate-700 leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-black/5 transition cursor-pointer"
          aria-label="Fechar alerta"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
