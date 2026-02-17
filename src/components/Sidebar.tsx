import { useState } from "react"

const navItems = ["Dashboard", "Expenses", "Budget", "Settings"]

export default function Sidebar() {
  const [active, setActive] = useState("Dashboard")

  return (
    <aside className="w-64 bg-black/30 backdrop-blur-md text-white min-h-screen p-6 hidden md:flex flex-col">
      <h1 className="text-2xl font-bold mb-8">CurrenSee</h1>
      <nav className="flex flex-col gap-4">
        {navItems.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            className={`text-left px-4 py-2 rounded-lg transition-colors duration-200
              ${active === item ? "bg-purple-400/30" : "hover:bg-purple-400/20"}`}
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  )
}
