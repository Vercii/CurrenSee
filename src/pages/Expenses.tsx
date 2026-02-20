import Layout from "../components/Layout.js"
import { useEffect, useState } from "react"
import { auth, db } from "../firebase.js"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts"

interface Expense {
  amount: number
  category: string
  type: "debit" | "credit"
  date: any
}

const COLORS = ["#a855f7", "#2778b3", "#aeb327", "#f97316", "#ec4899", "#facc15"]

export default function ReportPage() {
  const [transactions, setTransactions] = useState<Expense[]>([])
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [budget, setBudget] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return
      const uid = auth.currentUser.uid

      // Fetch user budget
      const userDoc = await (await import("firebase/firestore")).getDoc(
        (await import("firebase/firestore")).doc(db, "users", uid)
      )
      if (userDoc.exists()) setBudget(userDoc.data().budget ?? 0)

      // Fetch transactions
      const q = query(collection(db, "users", uid, "transactions"))
      const snapshot = await getDocs(q)

      const txs: Expense[] = snapshot.docs.map((doc) => doc.data() as Expense)
      setTransactions(txs)

      const catTotals: Record<string, number> = {}
      let total = 0
      txs.forEach((t) => {
        if (t.type === "debit") {
          total += t.amount
          catTotals[t.category] = (catTotals[t.category] || 0) + t.amount
        }
      })
      setTotalExpenses(total)

      const data = Object.entries(catTotals).map(([name, value]) => ({ name, value }))
      setCategoryData(data)
    }

    fetchData()
  }, [])

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Reports</h1>

        <div className="mb-6">
          <h2 className="text-xl mb-2">Total Expenses vs Budget</h2>
          <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 w-64 text-white">
            <p>Total Budget: ₱{budget}</p>
            <p>Total Expenses: ₱{totalExpenses}</p>
            <p>Budget Left: ₱{budget - totalExpenses}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl mb-2">Expenses by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h2 className="text-xl mb-2">Recent Transactions</h2>
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4">
            {transactions.slice(0, 5).map((t, i) => (
              <div key={i} className="flex justify-between p-2 border-b border-white/10 text-white">
                <span>{t.category}</span>
                <span>{t.type === "credit" ? `+₱${t.amount}` : `₱${t.amount}`}</span>
                <span>{new Date(t.date?.toDate?.() ?? t.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
