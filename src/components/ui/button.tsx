import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-[transform,background-color,border-color,box-shadow,color,filter] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 md:will-change-transform md:transition-all md:duration-300 md:hover:-translate-y-0.5 md:active:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "brand-gradient-bg text-white shadow-[0_18px_44px_-24px_rgba(124,58,237,0.42)] hover:brightness-105 md:shadow-[0_20px_50px_-28px_rgba(124,58,237,0.45)] md:hover:shadow-[0_26px_60px_-30px_rgba(124,58,237,0.52)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_16px_40px_-22px_hsl(var(--destructive))] hover:bg-destructive/90 md:shadow-[0_20px_44px_-28px_hsl(var(--destructive))] md:hover:shadow-[0_26px_54px_-30px_hsl(var(--destructive))]",
        outline:
          "border border-border/80 bg-white/90 text-foreground shadow-sm hover:border-primary/15 hover:bg-white md:shadow-[0_14px_30px_-22px_rgba(15,23,42,0.18)] md:hover:shadow-[0_18px_38px_-24px_rgba(15,23,42,0.22)]",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 md:shadow-[0_14px_28px_-20px_rgba(15,23,42,0.16)] md:hover:shadow-[0_18px_34px_-22px_rgba(15,23,42,0.2)]",
        ghost: "text-muted-foreground hover:bg-muted/80 hover:text-foreground md:hover:bg-muted/70",
        link: "text-primary underline-offset-4 hover:underline md:hover:opacity-90",
      },
      size: {
        default: "h-11 px-4 py-2 md:h-12 md:px-5",
        sm: "h-9 rounded-lg px-3 md:h-10 md:rounded-xl",
        lg: "h-12 rounded-xl px-8 md:h-14 md:px-8",
        icon: "h-10 w-10 md:h-11 md:w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
