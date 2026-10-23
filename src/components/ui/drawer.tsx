"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  side?: "left" | "right";
  width?: "sm" | "md" | "lg";
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = "left",
  width = "md",
  className,
}: DrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const widthClass = {
    sm: "max-w-xs",
    md: "max-w-sm sm:max-w-md",
    lg: "max-w-md sm:max-w-lg",
  }[width];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity",
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed inset-y-0 z-50 flex w-full flex-col bg-white shadow-2xl border-slate-200 transition-transform duration-300 ease-in-out",
          side === "left"
            ? "left-0 border-r"
            : "right-0 border-l",
          side === "left"
            ? isOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : isOpen
              ? "translate-x-0"
              : "translate-x-full",
          widthClass,
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
            <div className="font-bold text-sm text-slate-900">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
