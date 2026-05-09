import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-accent-2 to-accent text-[#02180e] font-semibold hover:brightness-110 shadow-[0_3px_16px_hsl(var(--accent)/0.2)]",
        ghost:
          "bg-bg-elev text-fg border border-border hover:border-border-strong hover:bg-bg-elev-2",
        danger:
          "bg-transparent text-danger border border-danger/40 hover:bg-danger/10",
        link: "underline-offset-4 hover:underline text-accent-4",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        default: "px-3 py-1.5 text-[12.5px]",
        lg: "px-[18px] py-2.5 text-[13.5px]",
      },
    },
    defaultVariants: { variant: "ghost", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  }
);
Button.displayName = "Button";
export { buttonVariants };
