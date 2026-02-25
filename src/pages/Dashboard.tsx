// src/pages/Dashboard.tsx
import Layout from "../components/Layout.js"
import GlassCard from "../components/GlassCard.js"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../firebase.js"
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
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
  const navigate = useNavigate()
  const [userName, setUserName] = useState("")
  const [loadingUser, setLoadingUser] = useState(true)
  const [budgetLeft, setBudgetLeft] = useState(0)
  const [totalCredited, setTotalCredited] = useState(0)
  const [totalDebited, setTotalDebited] = useState(0)
  const [transactions, setTransactions] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [topCategory, setTopCategory] = useState("N/A")
  const [recentTransaction, setRecentTransaction] = useState("—")

  useEffect(() => {
    let transactionsUnsub: (() => void) | null = null
    let userDocUnsub: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (user: FirebaseUser | null) => {
        if (!user) {
          setUserName("")

          setBudgetLeft(0)
          setTotalCredited(0)
          setTotalDebited(0)
          setTransactions([])
          setTotal(0)
          setTopCategory("N/A")
          setRecentTransaction("—")
          setLoadingUser(false)
          return
        }

        const uid = user.uid
        const userDocRef = doc(db, "users", uid)

        // Real-time user stats
        userDocUnsub = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            setUserName(data.name ?? user.displayName ?? "User")
            setBudgetLeft(data.budgetLeft ?? 0)
            setTotal(data.totalExpenses ?? 0)
            setTopCategory(data.topCategory ?? "N/A")
            setRecentTransaction(data.recentTransaction ?? "—")
          }
          setLoadingUser(false)
        })

        // Real-time transaction history
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

          // Compute totals
          let credited = 0
          let debited = 0
          txs.forEach((t) => {
            if (t.type === "credit") credited += t.amount
            else debited += t.amount
          })
          setTotalCredited(credited)
          setTotalDebited(debited)
        })
      }
    )

    return () => {
      unsubscribeAuth()
      if (transactionsUnsub) transactionsUnsub()
      if (userDocUnsub) userDocUnsub()
    }
  }, [])

  // -----------------------------
  // Glow, border, and text color
  // -----------------------------
  const getColorClasses = () => {
    if (budgetLeft < 40) return {
      text: "text-red-400",
      border: "border-red-500",
      shadow: "shadow-red-500/70"
    }
    if (budgetLeft < 70) return {
      text: "text-yellow-400",
      border: "border-yellow-400",
      shadow: "shadow-yellow-400/70"
    }
    return {
      text: "text-green-400",
      border: "border-green-400",
      shadow: "shadow-green-400/70"
    }
  }

  const colorClasses = getColorClasses()

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">
        {loadingUser ? "Loading..." : `Welcome, ${userName}!`}
      </h1>

      {/* -------------------- */}
      {/* Top Row: Balance Card */}
      {/* -------------------- */}
      <div className="mb-6">
        <div
          className={`flex justify-between items-center w-full gap-6
            p-6 rounded-xl
            bg-black/30 backdrop-blur-md border ${colorClasses.border}
            shadow-lg ${colorClasses.shadow}`}
        >
          {/* LEFT — Balance */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-white/90 text-sm">Balance</p>
            <p className={`text-3xl font-bold ${colorClasses.text}`}>
              ₱{budgetLeft}
            </p>
          </div>

          {/* RIGHT — Total Credited / Debited */}
          <div className="flex-1 flex flex-col justify-center text-right">
            <p className="text-white/70 text-sm">Total Credited</p>
            <p className="text-green-400 font-semibold text-lg">
              ₱{totalCredited}
            </p>
            <p className="text-white/70 text-sm mt-2">Total Debited</p>
            <p className="text-red-400 font-semibold text-lg">
              ₱{totalDebited}
            </p>
          </div>
        </div>
      </div>

      {/* -------------------- */}
      {/* Second Row: 3 Cards */}
      {/* -------------------- */}
      <div className="grid grid-cols-3 gap-6 mb-7">
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
              className={`flex items-start p-2 mb-2 rounded-md transition ${
                t.type === "credit"
                  ? "bg-green-400/10 hover:bg-green-400/20"
                  : "bg-black/10 hover:bg-purple-400/10"
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-lg leading-tight whitespace-normal break-all">
                  {t.category}
                </p>
              </div>

              <div className="whitespace-nowrap px-4 text-sm">
                {t.type === "credit" ? `+₱${t.amount}` : `₱${t.amount}`}
              </div>

              <div className="flex flex-col items-end whitespace-nowrap text-xs gap-1">
                <span>{new Date(t.date).toLocaleDateString()}</span>
                <button
                  onClick={() => alert("Deleting not implemented in this snippet")}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}