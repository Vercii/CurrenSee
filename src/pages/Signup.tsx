import { useState } from "react"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "../firebase" // db is Firestore
import { useNavigate } from "react-router-dom"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export default function Signup() {
  const [name, setName] = useState("")         // New field for user's name
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async () => {
    if (!name || !email || !password) return alert("Name, email, and password are required")
    setLoading(true)

    try {
      // 1️⃣ Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user
      console.log("Signed up user:", user)

      // 2️⃣ Create Firestore document in 'users' collection
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        name: name,
        email: user.email,
        createdAt: serverTimestamp()
      })

      // 3️⃣ Redirect to dashboard
      navigate("/")
    } catch (err: any) {
      alert("Signup failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="p-8 rounded-2xl bg-black/30 backdrop-blur-md w-96">
        <h2 className="text-2xl font-bold text-white mb-6">Sign Up</h2>

        {/* Name input */}
        <input
          type="text"
          placeholder="Name"
          className="w-full p-2 rounded-md mb-4 bg-white/5 text-white placeholder-gray-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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
          onClick={handleSignup}
          disabled={loading}
          className="w-full p-2 rounded-lg bg-purple-400/30 hover:bg-purple-400/50 transition"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </div>
    </div>
  )
}
