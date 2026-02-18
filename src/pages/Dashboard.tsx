// src/pages/Dashboard.tsx
import Layout from "../components/Layout"
import ExpenseList from "../components/ExpenseCard"
import GlassCard from "../components/GlassCard"
import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc
} from "firebase/firestore"
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"

export default function Dashboard() {
  const [total, setTotal] = useState(0)
  const [topCategory, setTopCategory] = useState("N/A")
  const [userName, setUserName] = useState("")
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    let expenseUnsub: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!user) {
        setUserName("")
        setLoadingUser(false)
        return
      }

      // ----------------------------
      // 1️⃣ Fetch user profile (UID doc)
      // ----------------------------
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))

        if (userDoc.exists()) {
          setUserName(userDoc.data().name)
        } else {
          // fallback to Firebase Auth display name
          setUserName(user.displayName || "User")
        }
      } catch (err) {
        console.error("Failed to fetch user:", err)
      } finally {
        setLoadingUser(false)
      }

      // ----------------------------
      // 2️⃣ Real-time expense stats
      // ----------------------------
      const q = query(
        collection(db, "expenses"),
        where("userId", "==", user.uid)
      )

      expenseUnsub = onSnapshot(q, (snapshot) => {
        let sum = 0
        const catMap: Record<string, number> = {}

        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          sum += data.amount ?? 0
          catMap[data.category] =
            (catMap[data.category] || 0) + (data.amount ?? 0)
        })

        setTotal(sum)

        const top = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
        setTopCategory(top ? top[0] : "N/A")
      })
    })

    // Cleanup everything
    return () => {
      unsubscribeAuth()
      if (expenseUnsub) expenseUnsub()
    }
  }, [])

  return (
    <Layout>
      {/* Welcome message */}
      <h1 className="text-3xl font-bold mb-6">
        {loadingUser ? "Loading..." : `Welcome, ${userName}!`}
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <GlassCard title="Total Expenses" value={`₱${total}`} />
        <GlassCard title="Top Category" value={topCategory} />
        <GlassCard title="Recent Transaction" value="—" />
        <GlassCard title="Budget Left" value="—" />
      </div>

      {/* Expense List */}
      <ExpenseList />
    </Layout>
  )
}
