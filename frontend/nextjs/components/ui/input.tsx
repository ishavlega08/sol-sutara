import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-dim",
        "focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/20 transition",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-fg",
        "focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/20",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border border-border-strong bg-bg px-3 py-2 font-mono text-xs text-fg min-h-[80px]",
        "focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/20",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block text-xs font-medium text-fg mb-1.5", className)} {...props} />;
}
