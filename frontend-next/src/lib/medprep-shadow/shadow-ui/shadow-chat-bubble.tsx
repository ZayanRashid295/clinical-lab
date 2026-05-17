"use client"

import { formatClinicalText } from "./format-clinical-text"

export type ShadowChatRole = "student" | "doctor" | "patient" | "system"

const roleStyles: Record<
  ShadowChatRole,
  { bubble: string; label: string }
> = {
  student: {
    bubble:
      "bg-sky-600 text-white rounded-2xl rounded-br-md shadow-sm",
    label: "You",
  },
  doctor: {
    bubble:
      "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-50 rounded-2xl rounded-bl-md border border-slate-200 dark:border-slate-600",
    label: "Doctor",
  },
  patient: {
    bubble:
      "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-50 rounded-2xl rounded-bl-md border border-emerald-200/80 dark:border-emerald-800",
    label: "Patient",
  },
  system: {
    bubble:
      "bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 rounded-xl border border-amber-200 dark:border-amber-800",
    label: "System",
  },
}

export function ShadowChatBubble({
  role,
  text,
  align = role === "student" ? "end" : "start",
  children,
}: {
  role: ShadowChatRole
  text: string
  align?: "start" | "end"
  children?: React.ReactNode
}) {
  const body = formatClinicalText(text)
  const styles = roleStyles[role]
  if (!body && !children) return null

  return (
    <div
      className={`flex flex-col gap-1 max-w-[85%] ${
        align === "end" ? "ml-auto items-end" : "mr-auto items-start"
      }`}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 px-1">
        {styles.label}
      </span>
      <div className={`px-4 py-2.5 ${styles.bubble}`}>
        {body ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{body}</p>
        ) : null}
        {children}
      </div>
    </div>
  )
}
