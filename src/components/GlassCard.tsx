interface GlassCardProps {
  title: string
  value: string | number
  subtitle?: string
  hoverColor?: string
  textColor?: string
  onClick?: () => void
}

export default function GlassCard({
  title,
  value,
  subtitle,
  onClick,
  hoverColor = "",
  textColor = "text-white"
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 cursor-pointer transition ${hoverColor}`}
    >
      {/* TITLE */}
      <h3 className="text-white font-semibold text-lg break-words">
        {title}
      </h3>

      {/* SUBTITLE */}
      {subtitle && (
        <p className="text-yellow-300 text-xs font-medium break-words">
          {subtitle}
        </p>
      )}

      {/* VALUE — FIXED */}
      <p
        className={`mt-2 font-bold ${textColor}
        text-lg sm:text-xl md:text-2xl
        break-words whitespace-normal break-all min-w-0`}
      >
        {value}
      </p>
    </div>
  )
}