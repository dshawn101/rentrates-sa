import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        {
          "border-transparent bg-primary/20 text-primary-foreground hover:bg-primary/30 text-purple-200": variant === "default",
          "border-transparent bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30": variant === "success",
          "border-transparent bg-amber-500/20 text-amber-200 hover:bg-amber-500/30": variant === "warning",
          "border-transparent bg-red-500/20 text-red-200 hover:bg-red-500/30": variant === "destructive",
          "text-slate-200 border-white/20 hover:bg-white/5": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
