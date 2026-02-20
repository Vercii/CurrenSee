// src/pages/Signup.tsx
import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth"
import { auth, db } from "../firebase"
import { useNavigate } from "react-router-dom"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"

export default function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  // 🔐 Password strength checker
  function getPasswordStrength(pw: string) {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[a-z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++
    return score
  }

  function strengthLabel(score: number) {
    if (score <= 2) return { text: "Weak", color: "text-red-400" }
    if (score <= 4) return { text: "Medium", color: "text-yellow-400" }
    return { text: "Strong", color: "text-green-400" }
  }

  function isStrongPassword(pw: string) {
    return getPasswordStrength(pw) === 5
  }

  // 📧 Gmail restriction (change if needed)
  function isAllowedEmail(email: string) {
    return email.endsWith("@gmail.com")
  }

  const passwordScore = getPasswordStrength(password)
  const { text: strengthText, color: strengthColor } = strengthLabel(passwordScore)

  const isFormValid =
    name &&
    email &&
    password &&
    isAllowedEmail(email) &&
    isStrongPassword(password)

  const handleSignup = async () => {
    setError("")

    if (!name || !email || !password) {
      setError("All fields are required.")
      return
    }

    if (!isAllowedEmail(email)) {
      setError("Please use a valid Gmail address.")
      return
    }

    if (!isStrongPassword(password)) {
      setError(
        "Password must meet all strength requirements."
      )
      return
    }

    setLoading(true)

    try {
      // 1️⃣ Create Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2️⃣ Send verification email
      await sendEmailVerification(user)

      // 3️⃣ Set display name
      await updateProfile(user, { displayName: name })

      // 4️⃣ Create Firestore user doc
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email: user.email,
        budget: 0,
        budgetLeft: 0,
        totalExpenses: 0,
        topCategory: "N/A",
        recentTransaction: "—",
        createdAt: serverTimestamp()
      })

      // 🔥 Redirect to verification screen
      navigate("/verify-email")
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="p-8 rounded-2xl bg-black/30 backdrop-blur-md w-96 border border-white/10">

        {/* Logo */}
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Curren
          <span className="text-red-400">See</span>
        </h2>

        {/* Name */}
        <input
          type="text"
          placeholder="Name"
          className="w-full p-2 rounded-md mb-4 bg-white/5 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Gmail address"
          className="w-full p-2 rounded-md mb-1 bg-white/5 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {email && !isAllowedEmail(email) && (
          <p className="text-red-400 text-sm mb-3">
            Only Gmail addresses are allowed.
          </p>
        )}

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded-md mb-1 bg-white/5 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Password requirements */}
       
        <div className="text-white/70 text-sm mb-1">
         <br></br>
          Password must contain:
          <ul className="list-disc ml-5">
            <li>At least 8 characters</li>
            <li>At least 1 uppercase letter (A-Z)</li>
            <li>At least 1 lowercase letter (a-z)</li>
            <li>At least 1 number (0-9)</li>
            <li>At least 1 special character (!@#$%^&* etc.)</li>
          </ul>
           <br></br>
        </div>

        {/* Strength indicator */}
        {password && (
          <p className={`text-sm mb-3 ${strengthColor}`}>
            Strength: {strengthText}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p className="text-red-400 text-sm mb-3">
            {error}
          </p>
        )}

        {/* Signup button */}
        <button
          onClick={handleSignup}
          disabled={!isFormValid || loading}
          className={`w-full p-2 rounded-lg transition font-medium ${
            !isFormValid || loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-purple-500 hover:bg-purple-600"
          }`}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

      </div>
    </div>
  )
}