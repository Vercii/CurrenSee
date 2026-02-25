import React from "react"

interface GlassCardProps {
  title?: string
  value?: string | number
  subtitle?: string
  hoverColor?: string
  textColor?: string
  onClick?: () => void
  children?: React.ReactNode
}

export default function GlassCard({
  title,
  value,
  subtitle,
  onClick,
  hoverColor = "",
  textColor = "text-white",
  children,
}: GlassCardProps) {
  const isClickable = !!onClick

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl bg-black/20 backdrop-blur-md
        border border-white/10 transition
        ${isClickable ? "cursor-pointer" : ""}
        ${hoverColor}
      `}
    >
      {/* HEADER (only shows if provided) */}
      {title && (
        <h3 className="text-white font-semibold text-lg break-words">
          {title}
        </h3>
      )}

      {/* SUBTITLE */}
      {subtitle && (
        <p className="text-yellow-300 text-xs font-medium break-words">
          {subtitle}
        </p>
      )}

      {/* VALUE */}
      {value !== undefined && value !== null && (
        <p
          className={`mt-2 font-bold ${textColor}
            text-lg sm:text-xl md:text-2xl
            break-words whitespace-normal break-all min-w-0`}
        >
          {value}
        </p>
      )}

      {/* CHILD CONTENT (forms, custom UI, etc.) */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}