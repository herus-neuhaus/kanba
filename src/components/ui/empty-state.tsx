import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className, 
  ...props 
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        "flex min-h-[300px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center animate-in fade-in duration-500",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
