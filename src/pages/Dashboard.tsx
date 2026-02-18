// src/pages/Dashboard.tsx
import Layout from "../components/Layout"
import GlassCard from "../components/GlassCard"
import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  orderBy,
  Timestamp
} from "firebase/firestore"
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"

interface Expense {
  id: string
  category: string
  amount: number
  date: any
  type: "debit" | "credit"
}

export default function Dashboard() {
  const [topCategory, setTopCategory] = useState("N/A")
  const [recentTransaction, setRecentTransaction] = useState<string>("—")
  const [userName, setUserName] = useState("")
  const [loadingUser, setLoadingUser] = useState(true)
  const [budget, setBudget] = useState(0)
  const [transactions, setTransactions] = useState<Expense[]>([])

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
        // ✅ Fetch user document
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)

        let userBudget = 50000
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserName(data.name ?? user.displayName ?? "User")
          userBudget = data.budget ?? 50000
          setBudget(userBudget)
        } else {
          setUserName(user.displayName ?? "User")
          setBudget(userBudget)
        }

        // ✅ Real-time expenses listener
        const q = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid),
          orderBy("date", "desc")
        )

        expenseUnsub = onSnapshot(q, (snapshot) => {
          const txs: Expense[] = []
          const catMap: Record<string, number> = {}

          snapshot.docs.forEach((doc) => {
            const data = doc.data()
            const amount = Number(data.amount ?? 0)
            const type = data.type ?? "debit"
            const category = data.category ?? "N/A"

            // Track category totals for Top Category
            if (type === "debit") catMap[category] = (catMap[category] || 0) + amount

            txs.push({
              id: doc.id,
              category,
              amount,
              date: data.date?.toDate?.() ?? new Date(),
              type
            })
          })

          setTransactions(txs)
          setTopCategory(Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A")

          // ✅ Most recent transaction
          if (txs.length > 0) setRecentTransaction(`${txs[0].category}: ${txs[0].type === "credit" ? '+' : '₱'}${txs[0].amount}`)
          else setRecentTransaction("—")
        })

      } catch (err) {
        console.error("Failed to fetch user:", err)
      } finally {
        setLoadingUser(false)
      }
    })

    return () => {
      unsubscribeAuth()
      if (expenseUnsub) expenseUnsub()
    }
  }, [])

  // -------------------
  // Add budget
  // -------------------
  const handleAddBudget = async () => {
    const addAmountStr = prompt("Enter amount to add to your budget:")
    const addAmount = Number(addAmountStr)
    if (!addAmount || addAmount <= 0) return
    if (!auth.currentUser) return

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid)

      // ✅ Update Firestore budget
      const newBudget = budget + addAmount
      await updateDoc(userDocRef, { budget: newBudget })
      setBudget(newBudget)

      // ✅ Log as CREDIT transaction
      await addDoc(collection(db, "expenses"), {
        userId: auth.currentUser.uid,
        amount: addAmount,
        category: "Budget Added",
        type: "credit",
        date: Timestamp.now()
      })
    } catch (err) {
      alert("Failed to update budget: " + err)
    }
  }

  // -------------------
  // Add expense (debit)
  // -------------------
  const handleAddExpense = async (category: string, amount: number) => {
    if (!auth.currentUser) return
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid)

      // ✅ Subtract from Firestore budget directly
      const newBudget = budget - amount
      await updateDoc(userDocRef, { budget: newBudget })
      setBudget(newBudget)

      // ✅ Add expense transaction
      await addDoc(collection(db, "expenses"), {
        userId: auth.currentUser.uid,
        amount,
        category,
        type: "debit",
        date: Timestamp.now()
      })
    } catch (err) {
      alert("Failed to add expense: " + err)
    }
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">
        {loadingUser ? "Loading..." : `Welcome, ${userName}!`}
      </h1>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 grid-rows-2 gap-6 mb-6">
        <GlassCard title="Total Expenses" value={`₱${transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0)}`} />
        <GlassCard title="Top Category" value={topCategory} />
        <GlassCard title="Recent Transaction" value={recentTransaction} />
        <div onClick={handleAddBudget} className="cursor-pointer">
          <GlassCard
            title="Budget Left"
            value={`₱${budget}`}
          />
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-6 p-4 bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
        <h3 className="text-white font-semibold mb-4 text-xl">
          Transaction History
        </h3>

        {transactions.length === 0 && (
          <p className="text-white/60">No transactions yet.</p>
        )}

        <div className="overflow-y-auto max-h-64">
          {transactions.map((t) => (
            <div
              key={t.id}
              className={`flex justify-between p-2 mb-2 rounded-md transition ${
                t.type === "credit"
                  ? "bg-green-400/10 hover:bg-green-400/20"
                  : "bg-black/10 hover:bg-purple-400/10"
              }`}
            >
              <span>{t.category}</span>
              <span>{t.type === "credit" ? `+₱${t.amount}` : `₱${t.amount}`}</span>
              <span>{new Date(t.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
