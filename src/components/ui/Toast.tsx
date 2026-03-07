import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "../../lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, message, type = "info", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 glass-panel px-4 py-3 shadow-lg pointer-events-auto transition-all duration-300 ease-in-out transform",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        type === "success" && "border-emerald-500/30 bg-emerald-500/10",
        type === "error" && "border-red-500/30 bg-red-500/10",
        type === "info" && "border-blue-500/30 bg-blue-500/10"
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5",
          type === "success" && "text-emerald-400",
          type === "error" && "text-red-400",
          type === "info" && "text-blue-400"
        )}
      />
      <p className="text-sm font-medium text-slate-200">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
        className="ml-auto text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
