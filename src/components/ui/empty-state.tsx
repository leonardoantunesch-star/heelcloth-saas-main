import * as React from "react";
import { FolderSearch } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50",
        className
      )}
      {...props}
    >
      <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3.5 shadow-2xs">
        {icon || <FolderSearch className="h-6 w-6 text-slate-400" />}
      </div>
      <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
