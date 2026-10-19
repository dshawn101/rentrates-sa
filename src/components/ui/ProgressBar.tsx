import * as React from "react"
import { cn } from "../../lib/utils"

const ProgressBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: number; max?: number; label?: string; showValue?: boolean }
>(({ className, value, max = 100, label, showValue, ...props }, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)} {...props} ref={ref}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-xs text-slate-300">
          {label && <span>{label}</span>}
          {showValue && <span>{value} / {max}</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
})
ProgressBar.displayName = "ProgressBar"

export { ProgressBar }
