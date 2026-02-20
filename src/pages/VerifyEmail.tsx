import { useEffect, useState } from "react"
import { auth } from "../firebase"
import { sendEmailVerification } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"

export default function VerifyEmail() {
  const [sending, setSending] = useState(false)
  const navigate = useNavigate()

  // 🔄 Check if email becomes verified
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload()

        if (auth.currentUser.emailVerified) {
          clearInterval(interval)
          navigate("/") // Go to dashboard
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [navigate])

  const resendVerification = async () => {
    if (!auth.currentUser) return
    setSending(true)

    try {
      await sendEmailVerification(auth.currentUser)
      alert("Verification email sent again.")
    } catch (err) {
      alert("Error sending email.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="p-8 rounded-2xl bg-black/30 backdrop-blur-md w-96 text-center border border-white/10">

        <h2 className="text-2xl font-bold text-white mb-4">
          Verify Your Email
        </h2>

        <p className="text-white/70 mb-6">
          We sent a verification link to your email.  
          Please check your inbox. If you don't see it, check your spam folder or click the button below to resend.
        </p>

        <button
          onClick={resendVerification}
          disabled={sending}
          className={`w-full p-2 rounded-lg transition ${
            sending
              ? "bg-gray-600"
              : "bg-purple-500 hover:bg-purple-600"
          }`}
        >
          {sending ? "Sending..." : "Resend Email"}
        </button>

        <button
        onClick={async () => {
            await auth.signOut()
            navigate("/login")
        }}
        className="mt-6 inline-block text-blue-400 underline"
        >
        Back to Login
        </button>
        <p className="text-white/40 text-sm mt-4">
          This page will automatically continue once verified.
        </p>

      </div>
    </div>
  )
}