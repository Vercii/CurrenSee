// src/components/Sidebar.tsx
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { FiMenu, FiX, FiHome, FiPlusCircle, FiBarChart2 } from "react-icons/fi"

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const links = [
    { name: "Dashboard", path: "/", icon: <FiHome /> },
    { name: "Add Expense", path: "/add", icon: <FiPlusCircle /> },
    { name: "Reports", path: "/reports", icon: <FiBarChart2 /> }
  ]

  const toggleSidebar = () => setOpen(!open)

  return (
    <>
      {/* Hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-black/20 backdrop-blur-md rounded-md text-white"
        onClick={toggleSidebar}
      >
        {open ? <FiX size={24} /> : <FiMenu size={24} />}
      </button>

      {/* Replace your old <aside> with this updated one */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 
          bg-black/60 md:bg-black/20 backdrop-blur-md border-r border-white/10 p-6
          transition-transform transform ${
            open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <h2 className="text-2xl font-bold mb-8 text-white">CurrenSee</h2>

        <nav className="flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 p-2 rounded-lg transition hover:bg-purple-400/20 hover:text-purple-300 ${
                location.pathname === link.path
                  ? "bg-purple-400/20 text-purple-300"
                  : "text-white/80"
              }`}
              onClick={() => setOpen(false)} // close sidebar on mobile after click
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
