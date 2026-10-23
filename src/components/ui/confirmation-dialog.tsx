"use client";

import * as React from "react";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmationDialogProps) {
  const icon = {
    danger: <AlertCircle className="h-6 w-6 text-rose-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    info: <Info className="h-6 w-6 text-blue-600" />,
  }[variant];

  const buttonVariant = {
    danger: "danger" as const,
    warning: "default" as const,
    info: "default" as const,
  }[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">{icon}</div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 leading-snug">{title}</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
