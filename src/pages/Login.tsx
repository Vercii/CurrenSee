import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase"
import { useNavigate, Link } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!email || !password) return alert("Email and password required")
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      console.log("Logged in user:", userCredential.user)
      navigate("/") // go to dashboard
    } catch (err: any) {
      alert("Login failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="p-8 rounded-2xl bg-black/30 backdrop-blur-md w-96 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-white mb-6">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded-md mb-4 bg-white/5 text-white placeholder-gray-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded-md mb-4 bg-white/5 text-white placeholder-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-2 rounded-lg bg-purple-400/30 hover:bg-purple-400/50 transition mb-4"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Sign Up Button */}
        <span className="text-white/70 text-sm">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-purple-400 hover:text-purple-300 font-semibold"
          >
            Sign Up
          </Link>
        </span>
      </div>
    </div>
  )
}
