// src/components/GlassCard.tsx
interface GlassCardProps {
  title: string
  value: string | number
}

export default function GlassCard({ title, value }: GlassCardProps) {
  return (
    <div className="p-6 rounded-xl bg-black/20 backdrop-blur-md border border-white/10 hover:bg-purple-400/20 hover:border-purple-400/30 transition">
      <h3 className="text-white/70 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
