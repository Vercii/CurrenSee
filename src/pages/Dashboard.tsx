// src/pages/Dashboard.tsx
import Layout from "../components/layout"
import ExpenseList from "../components/ExpenseCard"
import GlassCard from "../components/GlassCard"
import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import { collection, query, where, getDocs } from "firebase/firestore"

export default function Dashboard() {
  const [total, setTotal] = useState(0)
  const [topCategory, setTopCategory] = useState("N/A")

  useEffect(() => {
    const fetchStats = async () => {
      if (!auth.currentUser) return
      const q = query(
        collection(db, "expenses"),
        where("userId", "==", auth.currentUser.uid)
      )
      const snapshot = await getDocs(q)
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
    }

    fetchStats()
  }, [])

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <GlassCard title="Total Expenses" value={`₱${total}`} />
        <GlassCard title="Top Category" value={topCategory} />
        <GlassCard title="Recent Transaction" value="—" />
        <GlassCard title="Budget Left" value="—" />
      </div>
      <ExpenseList />
    </Layout>
  )
}
