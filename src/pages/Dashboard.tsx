// src/pages/Dashboard.tsx
import Layout from "../components/Layout"
import ExpenseList from "../components/ExpenseCard"
import GlassCard from "../components/GlassCard"
import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import { collection, query, where, onSnapshot, doc, getDoc, orderBy, limit } from "firebase/firestore"
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"

export default function Dashboard() {
  const [total, setTotal] = useState(0)
  const [topCategory, setTopCategory] = useState("N/A")
  const [recentTransaction, setRecentTransaction] = useState<string>("—")
  const [userName, setUserName] = useState("")
  const [loadingUser, setLoadingUser] = useState(true)
  const [budget, setBudget] = useState(0)
  const [budgetLeft, setBudgetLeft] = useState(0)

  useEffect(() => {
    let expenseUnsub: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!user) {
        setUserName("")
        setBudget(0)
        setLoadingUser(false)
        return
      }

      try {
        // Fetch user document from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserName(data.name ?? user.displayName ?? "User")
          setBudget(data.budget ?? 50000) // fallback default budget
        } else {
          setUserName(user.displayName ?? "User")
          setBudget(50000)
        }
      } catch (err) {
        console.error("Failed to fetch user:", err)
        setBudget(50000)
      } finally {
        setLoadingUser(false)
      }

      // Real-time expenses listener
      const q = query(
        collection(db, "expenses"),
        where("userId", "==", user.uid),
        orderBy("date", "desc") // sort newest first
      )

      expenseUnsub = onSnapshot(q, (snapshot) => {
        let sum = 0
        const catMap: Record<string, number> = {}

        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          const amount = Number(data.amount ?? 0)
          sum += amount
          catMap[data.category] = (catMap[data.category] || 0) + amount
        })

        setTotal(sum)
        setTopCategory(Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A")
        setBudgetLeft(budget - sum)

        // Most recent transaction
        if (snapshot.docs.length > 0) {
          const recent = snapshot.docs[0].data()
          setRecentTransaction(`${recent.category}: ₱${recent.amount}`)
        } else {
          setRecentTransaction("—")
        }
      })
    })

    return () => {
      unsubscribeAuth()
      if (expenseUnsub) expenseUnsub()
    }
  }, [budget])

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
        <GlassCard title="Recent Transaction" value={recentTransaction} />
        <GlassCard title="Budget Left" value={`₱${budgetLeft}`} />
      </div>

    </Layout>
  )
}
