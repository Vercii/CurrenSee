interface GlassCardProps {
  title: string
  value: string | number
}

export default function GlassCard({ title, value }: GlassCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 
                    hover:bg-purple-400/20 hover:border-purple-400/30 
                    transition-all duration-300 flex flex-col items-start">
      <h3 className="text-gray-200 font-semibold">{title}</h3>
      <p className="text-white text-2xl font-bold mt-2">{value}</p>
    </div>
  )
}
