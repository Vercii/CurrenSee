// src/pages/Dashboard.tsx
import Layout from "../components/Layout"
import ExpenseList from "../components/ExpenseCard"
import GlassCard from "../components/GlassCard"
import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

interface User {
  uid: string
  name: string
  email: string
}

export default function Dashboard() {
  const [total, setTotal] = useState(0)
  const [topCategory, setTopCategory] = useState("N/A")
  const [userName, setUserName] = useState<string>("")
  const [loadingUser, setLoadingUser] = useState(true)

  // ----------------------------
  // Fetch logged-in user's name safely
  // ----------------------------
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUserName("")
        setLoadingUser(false)
        return
      }

      // fetch user profile from Firestore
      const fetchUser = async () => {
        try {
          const q = query(collection(db, "users"), where("uid", "==", user.uid))
          const snapshot = await getDocs(q)
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data() as User
            setUserName(userData.name)
          }
        } catch (err) {
          console.error("Failed to fetch user:", err)
        } finally {
          setLoadingUser(false)
        }
      }

      fetchUser()
    })

    return () => unsubscribeAuth()
  }, [])

  // ----------------------------
  // Real-time stats update
  // ----------------------------
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) return

      const q = query(
        collection(db, "expenses"),
        where("userId", "==", user.uid)
      )

      const expenseUnsub = onSnapshot(q, (snapshot) => {
        let sum = 0
        const catMap: Record<string, number> = {}

        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          sum += data.amount
          catMap[data.category] = (catMap[data.category] || 0) + data.amount
        })

        setTotal(sum)
        const top = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
        setTopCategory(top ? top[0] : "N/A")
      })

      return () => expenseUnsub()
    })

    return () => unsubscribe()
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
