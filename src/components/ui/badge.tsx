import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      status: {
        backlog: "bg-muted text-muted-foreground [a]:hover:bg-muted/80",
        planned: "bg-blue-500/10 text-blue-600 [a]:hover:bg-blue-500/20",
        "in-progress": "bg-amber-500/10 text-amber-600 [a]:hover:bg-amber-500/20",
        completed: "bg-emerald-500/10 text-emerald-600 [a]:hover:bg-emerald-500/20",
        canceled: "bg-destructive/10 text-destructive line-through opacity-60 [a]:hover:bg-destructive/20",
      },
    },
    defaultVariants: {
      status: "backlog",
    },
  }
)
// Type matching your Convex schema
type BadgeStatus = "backlog" | "planned" | "in-progress" | "completed" | "canceled";

interface BadgeProps extends useRender.ComponentProps<"span">, VariantProps<typeof statusVariants> {
  status?: BadgeStatus;
}
function Badge({
  className,
  status = "backlog",
  render,
  ...props
}: useRender.ComponentProps<"span"> & 
   VariantProps<typeof statusVariants> & {
     status?: BadgeStatus
   }) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(statusVariants({ status }), className),
       
        "aria-label": status,
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      status,
    },
  })
}
export { Badge , type BadgeProps }