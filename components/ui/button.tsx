import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 transition-all duration-300 ease-out sm:hover:scale-105 active:scale-95 shadow-sm active:shadow-none",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-indigo-500/25",
        outline:
          "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 aria-expanded:bg-indigo-100 aria-expanded:text-indigo-800",
        ghost:
          "shadow-none hover:bg-slate-100 hover:text-slate-900 aria-expanded:bg-slate-100 sm:hover:scale-100 dark:hover:bg-muted/50",
        destructive:
          "bg-rose-50 text-rose-600 hover:bg-rose-100 focus-visible:border-rose-400 focus-visible:ring-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 shadow-none",
        action: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/25",
        link: "text-indigo-600 shadow-none underline-offset-4 hover:underline sm:hover:scale-100",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-lg px-4 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-14 gap-2 px-8 text-base shadow-md",
        icon: "size-11",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-lg",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
