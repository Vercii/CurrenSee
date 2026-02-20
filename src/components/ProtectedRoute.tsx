import { ReactNode, useEffect, useState } from "react"
import { auth } from "../firebase.js"
import { onAuthStateChanged } from "firebase/auth"
import { useNavigate } from "react-router-dom"

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login")
        return
      }

      if (!user.emailVerified) {
        navigate("/verify-email")
        return
      }

      setLoading(false)
    })

    return () => unsub()
  }, [navigate])

  if (loading) return <div className="text-white p-8">Loading...</div>

  return <>{children}</>
}