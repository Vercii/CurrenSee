// src/pages/Dashboard.tsx
import Layout from "../components/Layout"
import GlassCard from "../components/GlassCard"
import { useEffect, useState } from "react"
import { auth, db } from "../firebase"
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  Timestamp,
  query,
  where,
  orderBy,
  onSnapshot
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
  const [userName, setUserName] = useState("")
  const [loadingUser, setLoadingUser] = useState(true)
  const [budget, setBudget] = useState(0)
  const [budgetLeft, setBudgetLeft] = useState(0)
  const [total, setTotal] = useState(0)
  const [topCategory, setTopCategory] = useState("N/A")
  const [recentTransaction, setRecentTransaction] = useState("—")
  const [transactions, setTransactions] = useState<Expense[]>([])

  useEffect(() => {
    let expenseUnsub: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!user) {
        setUserName("")
        setBudget(0)
        setBudgetLeft(0)
        setTotal(0)
        setTopCategory("N/A")
        setRecentTransaction("—")
        setLoadingUser(false)
        return
      }

      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDoc = await getDoc(userDocRef)

        // Fetch precomputed values
        let userBudget = 50000
        let userTotal = 0
        let userTopCat = "N/A"
        let userRecent = "—"

        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserName(data.name ?? user.displayName ?? "User")
          userBudget = data.budget ?? 50000
          userTotal = data.totalExpenses ?? 0
          userTopCat = data.topCategory ?? "N/A"
          userRecent = data.recentTransaction ?? "—"
        } else {
          setUserName(user.displayName ?? "User")
        }

        setBudget(userBudget)
        setTotal(userTotal)
        setTopCategory(userTopCat)
        setRecentTransaction(userRecent)
        setBudgetLeft(userBudget)

        // Listen to all transactions for history (optional: we can skip recalculating totals here)
        const txQuery = query(
          collection(db, "expenses"),
          where("userId", "==", user.uid),
          orderBy("date", "desc")
        )
        expenseUnsub = onSnapshot(txQuery, (snapshot) => {
          const txs: Expense[] = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              category: data.category ?? "Uncategorized",
              amount: Number(data.amount ?? 0),
              type: data.type ?? "debit",
              date: data.date?.toDate?.() ?? new Date()
            }
          })
          setTransactions(txs)
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

  // ---------------------------
  // Add Budget
  // ---------------------------
  const handleAddBudget = async () => {
    const addAmountStr = prompt("Enter amount to add to your budget:")
    const addAmount = Number(addAmountStr)
    if (!addAmount || addAmount <= 0) return
    if (!auth.currentUser) return

    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid)

      // Update budget in Firestore
      const newBudget = budget + addAmount
      const newTotal = total // totalExpenses doesn't change
      await updateDoc(userDocRef, { budget: newBudget })

      // Log CREDIT transaction
      await addDoc(collection(db, "expenses"), {
        userId: auth.currentUser.uid,
        amount: addAmount,
        category: "Budget Added",
        type: "credit",
        date: Timestamp.now()
      })

      // Update user doc summary fields
      const recentTxStr = `Budget Added: +₱${addAmount}`
      await updateDoc(userDocRef, { recentTransaction: recentTxStr })

      setBudget(newBudget)
      setBudgetLeft(newBudget - newTotal)
      setRecentTransaction(recentTxStr)
    } catch (err) {
      alert("Failed to update budget: " + err)
    }
  }

  // ---------------------------
  // Add Expense (debit)
  // ---------------------------
  const handleAddExpense = async (category: string, amount: number) => {
    if (!auth.currentUser) return
    try {
      const userDocRef = doc(db, "users", auth.currentUser.uid)

      const newTotal = total + amount
      const newBudgetLeft = budget - newTotal

      // Update totalExpenses and recentTransaction directly in user doc
      const recentTxStr = `${category}: ₱${amount}`
      await updateDoc(userDocRef, {
        budget: budget,
        totalExpenses: newTotal,
        recentTransaction: recentTxStr,
      })

      // Update Top Category
      const catTotals = {} as Record<string, number>
      transactions.forEach((t) => {
        if (t.type === "debit") catTotals[t.category] = (catTotals[t.category] || 0) + t.amount
      })
      catTotals[category] = (catTotals[category] || 0) + amount
      const newTopCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A"
      await updateDoc(userDocRef, { topCategory: newTopCat })

      // Add debit transaction
      await addDoc(collection(db, "expenses"), {
        userId: auth.currentUser.uid,
        amount,
        category,
        type: "debit",
        date: Timestamp.now()
      })

      // Update local state
      setTotal(newTotal)
      setBudgetLeft(newBudgetLeft)
      setTopCategory(newTopCat)
      setRecentTransaction(recentTxStr)
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
        <GlassCard
          title="Total Expenses"
          value={`₱${total}`}
          hoverColor="hover:bg-[#a85432]/20 hover:border-[#a85432]/40"
        />

        <GlassCard
          title="Top Category"
          value={topCategory}
          hoverColor="hover:bg-[#aeb327]/20 hover:border-[#aeb327]/40"
        />

        <GlassCard
          title="Recent Transaction"
          value={recentTransaction}
          hoverColor="hover:bg-[#2778b3]/20 hover:border-[#2778b3]/40"
        />

        <GlassCard
          title="Budget Left"
          value={`₱${budgetLeft}`}
          onClick={handleAddBudget}
          textColor={budgetLeft >= 15 ? "text-lime-400" : "text-red-500"}
        />
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
              <span>
                {t.type === "credit" ? `+₱${t.amount}` : `₱${t.amount}`}
              </span>
              <span>
                {new Date(t.date).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
