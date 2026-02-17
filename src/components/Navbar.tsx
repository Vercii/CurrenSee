export default function Navbar() {
  return (
    <div className="w-full flex justify-end items-center p-4 bg-black/20 backdrop-blur-md">
      <span className="text-white/80 mr-4">Hi, Renzo</span>
      <button className="px-4 py-2 rounded-lg bg-purple-400/30 hover:bg-purple-400/50 transition">
        Logout
      </button>
    </div>
  )
}
