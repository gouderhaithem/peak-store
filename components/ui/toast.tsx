"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  kind: ToastKind;
  duration: number;
}

interface ToastContextValue {
  toast: (input: Omit<ToastItem, "id" | "duration"> & { duration?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ title, description, kind, duration = 3500 }) => {
      counter += 1;
      const id = counter;
      setToasts((curr) => [...curr, { id, title, description, kind, duration }]);
    },
    []
  );

  const success = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, kind: "success" }),
    [toast]
  );
  const error = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, kind: "error" }),
    [toast]
  );
  const info = useCallback(
    (title: string, description?: string) =>
      toast({ title, description, kind: "info" }),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-[calc(100%-2rem)]">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enter = setTimeout(() => setVisible(true), 10);
    const exit = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 200);
    }, toast.duration);
    return () => {
      clearTimeout(enter);
      clearTimeout(exit);
    };
  }, [toast, onDismiss]);

  const palette = {
    success: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
    error: { icon: AlertCircle, color: "text-[#DC2626]", bg: "bg-red-50", border: "border-red-200" },
    info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  }[toast.kind];

  const Icon = palette.icon;

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto bg-white border border-[#E5E5E5] rounded-xl shadow-lg p-4 flex items-start gap-3 transition-all duration-200",
        visible
          ? "translate-x-0 opacity-100"
          : "translate-x-4 opacity-0"
      )}
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", palette.bg, palette.border, "border")}>
        <Icon className={cn("w-5 h-5", palette.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0A0A0A]">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-[#525252] mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-[#A3A3A3] hover:text-[#0A0A0A] transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
