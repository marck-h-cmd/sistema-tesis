import * as React from "react"
import { cn } from "@/lib/utils/cn"
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react"

interface AlertProps {
  variant?: "default" | "success" | "warning" | "error" | "info"
  title?: string
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

const variants = {
  default: "bg-gray-50 border-gray-200 text-gray-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
}

const icons = {
  default: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
}

export function Alert({ variant = "default", title, children, onClose, className }: AlertProps) {
  const Icon = icons[variant]

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border p-4", variants[variant], className)}>
      <Icon className="h-5 w-5 mt-0.5" />
      <div className="flex-1">
        {title && <h5 className="font-medium mb-1">{title}</h5>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}