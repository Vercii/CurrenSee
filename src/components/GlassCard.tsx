interface GlassCardProps {
  title: string
  value: string
  valueClassName?: string
  onClick?: () => void
}

export default function GlassCard({
  title,
  value,
  valueClassName = "",
  onClick
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className="p-6 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-purple-400/10 transition cursor-pointer"
    >
      <h3 className="text-white/70 mb-2">{title}</h3>
      <p className={`text-2xl font-bold ${valueClassName}`}>
        {value}
      </p>
    </div>
  )
}
