import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: gold bg, navy text, uppercase JetBrains Mono, wide tracking
        default:
          "bg-[#C4993A] text-[#0C2340] hover:bg-[#9E7B2A] font-mono font-medium uppercase tracking-[0.18em]",
        // Destructive uses warm-gray (no red in the brand)
        destructive:
          "bg-[#8C8278] text-[#FAFAF8] hover:bg-[#7A726A] font-mono font-medium uppercase tracking-[0.18em]",
        // Secondary / ghost: transparent, thin gold border, gold text
        outline:
          "border border-[#C4993A] bg-transparent text-[#C4993A] hover:bg-[#C4993A]/10 font-mono font-medium uppercase tracking-[0.18em]",
        secondary:
          "border border-[#C4993A] bg-transparent text-[#C4993A] hover:bg-[#C4993A]/10 font-mono font-medium uppercase tracking-[0.18em]",
        ghost:
          "bg-transparent text-[#C4993A] hover:bg-[#C4993A]/10 font-mono font-medium uppercase tracking-[0.18em]",
        link: "text-[#C4993A] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
