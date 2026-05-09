import * as React from "react";

type Variant = "primary" | "ghost";
type Size = "sm" | "default" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap active:translate-y-px";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-accent-2 to-accent text-[#02180e] font-semibold hover:brightness-110 shadow-[0_3px_16px_hsl(var(--accent)/0.2)]",
  ghost:
    "bg-bg-elev text-fg border border-border hover:border-border-strong hover:bg-bg-elev-2",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  default: "px-3 py-1.5 text-[12.5px]",
  lg: "px-[18px] py-2.5 text-[13.5px]",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "ghost", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={[base, variants[variant], sizes[size], className].join(" ")}
      {...props}
    />
  )
);
Button.displayName = "Button";
