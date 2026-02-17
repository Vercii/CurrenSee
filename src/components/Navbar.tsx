import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import { useNavigate } from "react-router-dom"

export default function Navbar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate("/login") // redirect to login page
    } catch (err: any) {
      alert("Logout failed: " + err.message)
    }
  }

  return (
    <div className="w-full flex justify-end items-center p-4 bg-black/20 backdrop-blur-md">
      <span className="text-white/80 mr-4">{auth.currentUser?.email}</span>
      <button
        onClick={handleLogout}
        className="px-4 py-2 rounded-lg bg-purple-400/30 hover:bg-purple-400/50 transition"
      >
        Logout
      </button>
    </div>
  )
}
