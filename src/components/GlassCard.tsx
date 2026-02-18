interface GlassCardProps {
  title: string
  value: string | number
  hoverColor?: string
  textColor?: string
  onClick?: () => void
}

export default function GlassCard({
  title,
  value,
  hoverColor = "hover:bg-purple-400/10 hover:border-purple-400/30",
  textColor = "text-white",
  onClick
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 transition cursor-pointer ${hoverColor}`}
    >
      <h3 className="text-white/70 mb-2">{title}</h3>

      {/* ✅ Apply custom color here */}
      <p className={`text-2xl font-bold ${textColor}`}>
        {value}
      </p>
    </div>
  )
}
