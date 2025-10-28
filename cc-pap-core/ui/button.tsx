
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sap-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // SAP Emphasized Button (Primary Action)
        default: "sap-button-emphasized shadow-sap-level-1 hover:shadow-sap-level-2 active:shadow-sap-level-0",
        // SAP Standard Button
        secondary: "sap-button-standard shadow-sap-level-1 hover:shadow-sap-level-2 active:shadow-sap-level-0",
        // SAP Ghost Button (Transparent)
        ghost: "hover:bg-muted hover:text-accent-foreground rounded-sm",
        // SAP Destructive Button
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sap-level-1 hover:shadow-sap-level-2 rounded-sm font-medium",
        // SAP Outline Button
        outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-sap-level-1 hover:shadow-sap-level-2 rounded-sm font-medium",
        // SAP Link Button
        link: "text-primary underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "min-h-[2.75rem] px-sap-4 py-sap-2", // SAP Standard height 44px
        sm: "min-h-[2rem] px-sap-3 py-sap-1 text-sap-xs", // SAP Compact height 32px
        lg: "min-h-[3rem] px-sap-6 py-sap-3 text-sap-base", // SAP Cozy height 48px
        icon: "h-10 w-10 rounded-sm",
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
