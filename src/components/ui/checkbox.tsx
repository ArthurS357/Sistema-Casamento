import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <span className="relative inline-flex h-5 w-5 shrink-0">
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "peer h-5 w-5 cursor-pointer appearance-none rounded-[5px] border border-slate-300 bg-white transition-all duration-200 checked:border-gold-400 checked:bg-gold-400 hover:border-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 focus-visible:ring-offset-1 aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-500",
          className,
        )}
        {...props}
      />
      <Check
        aria-hidden
        strokeWidth={3.5}
        className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 text-slate-900 opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
      />
    </span>
  ),
);
Checkbox.displayName = "Checkbox";
