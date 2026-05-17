"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/shared/utils/cn"

export function ShadowModalShell({
  open,
  onOpenChange,
  title,
  icon,
  badge,
  children,
  className,
  maxWidth = "max-w-4xl",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
  maxWidth?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          maxWidth,
          "max-h-[90vh] overflow-y-auto border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50",
          className,
        )}
      >
        <DialogHeader className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            {icon}
            {title}
            {badge}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-2">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
