// src/pages/Dashboard.tsx
import Layout from "../components/Layout.js"
import GlassCard from "../components/GlassCard.js"
import { useEffect, useState } from "react"
import { auth, db } from "../firebase.js"
import {
  collection,
  addDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  updateDoc,
  getDoc
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
    let transactionsUnsub: (() => void) | null = null
    let userDocUnsub: (() => void) | null = null

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

      const uid = user.uid
      const userDocRef = doc(db, "users", uid)

      // Listen to user doc for real-time stats
      userDocUnsub = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          setUserName(data.name ?? user.displayName ?? "User")
          setBudget(data.budget ?? 0)
          setTotal(data.totalExpenses ?? 0)
          setBudgetLeft(data.budgetLeft ?? (data.budget ?? 0) - (data.totalExpenses ?? 0))
          setTopCategory(data.topCategory ?? "N/A")
          setRecentTransaction(data.recentTransaction ?? "—")
        }
        setLoadingUser(false)
      })

      // Listen to transactions for history only
      const txQuery = query(
        collection(db, "users", uid, "transactions"),
        orderBy("date", "desc")
      )
      transactionsUnsub = onSnapshot(txQuery, (snapshot) => {
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
    })

    return () => {
      unsubscribeAuth()
      if (transactionsUnsub) transactionsUnsub()
      if (userDocUnsub) userDocUnsub()
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
      const uid = auth.currentUser.uid
      const userDocRef = doc(db, "users", uid)

      // Fetch current budget and totalExpenses
      const userDocSnap = await getDoc(userDocRef)
      let currentBudget = 0
      let totalExpenses = 0
      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        currentBudget = data.budget ?? 0
        totalExpenses = data.totalExpenses ?? 0
      }

      const newBudget = currentBudget + addAmount
      const newBudgetLeft = newBudget - totalExpenses

      // Update user doc
      await updateDoc(userDocRef, {
        budget: newBudget,
        budgetLeft: newBudgetLeft,
        recentTransaction: `Budget Added: +₱${addAmount}`
      })

      // Add CREDIT transaction
      await addDoc(collection(db, "users", uid, "transactions"), {
        amount: addAmount,
        category: "Budget Added",
        type: "credit",
        date: Timestamp.now()
      })
    } catch (err) {
      alert("Failed to update budget: " + err)
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
              <span>{new Date(t.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
