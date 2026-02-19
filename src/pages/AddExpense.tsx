// src/pages/AddExpense.tsx
import Layout from "../components/Layout"
import { useState, useRef, useEffect } from "react"
import { auth, db } from "../firebase"
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, Timestamp } from "firebase/firestore"
import "../index.css"

const categories = [
  "Food",
  "Transportation",
  "Entertainment",
  "Bills",
  "Shopping",
  "Health",
  "Education",
  "Budget Added",
  "Other"
]

// Animated Liquid Glass Dropdown
function GlassDropdown({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      {/* Closed state */}
      <div
        className="p-2 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 text-white cursor-pointer flex justify-between items-center transition hover:ring-2 hover:ring-purple-400"
        onClick={() => setOpen(!open)}
      >
        {value || "Select a category"}
        <span className="ml-2">{open ? "▲" : "▼"}</span>
      </div>

      {/* Animated dropdown menu */}
      <div
        className={`absolute z-10 w-full mt-1 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 shadow-lg max-h-48 overflow-y-auto transform transition-all duration-200 origin-top ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        {categories.map((cat) => (
          <div
            key={cat}
            className={`p-2 cursor-pointer transition hover:bg-white/10 ${
              value === cat ? "bg-white/20 font-semibold" : ""
            }`}
            onClick={() => {
              onChange(cat)
              setOpen(false)
            }}
          >
            {cat}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AddExpensePage() {
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState<number | "">("")
  const [loading, setLoading] = useState(false)

  const handleAddExpense = async () => {
    if (!auth.currentUser) return
    if (!category || !amount || amount <= 0) return

    setLoading(true)
    const uid = auth.currentUser.uid
    const userDocRef = doc(db, "users", uid)

    try {
      await addDoc(collection(db, "users", uid, "transactions"), {
        amount: Number(amount),
        category,
        type: "debit",
        date: Timestamp.now()
      })

      const userDocSnap = await getDoc(userDocRef)
      let totalExpenses = 0
      let budget = 0
      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        totalExpenses = data.totalExpenses ?? 0
        budget = data.budget ?? 0
      }

      const newTotalExpenses = totalExpenses + Number(amount)
      const newBudgetLeft = budget - newTotalExpenses

      const txSnapshot = await getDocs(collection(db, "users", uid, "transactions"))
      const catTotals: Record<string, number> = {}
      txSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.type === "debit") {
          const cat = data.category ?? "Other"
          const amt = Number(data.amount ?? 0)
          catTotals[cat] = (catTotals[cat] || 0) + amt
        }
      })
      const newTopCategory = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A"

      await updateDoc(userDocRef, {
        totalExpenses: newTotalExpenses,
        budgetLeft: newBudgetLeft,
        recentTransaction: `${category}: ₱${amount}`,
        topCategory: newTopCategory
      })

      setCategory("")
      setAmount("")
    } catch (err) {
      console.error("Failed to add expense:", err)
      alert("Error adding expense: " + err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Add Expense</h1>
        <div className="max-w-md mx-auto">
          <label className="block text-white/80 mb-2">Category</label>
          <GlassDropdown value={category} onChange={setCategory} />

          <label className="block text-white/80 mb-2">Amount</label>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="p-2 mb-4 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 text-white w-full focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
          />

          <button
            onClick={handleAddExpense}
            disabled={loading}
            className={`w-full py-2 rounded-2xl transition font-medium ${
              loading ? "bg-gray-600 cursor-not-allowed text-white" : "bg-purple-500 hover:bg-purple-600 text-white"
            }`}
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </div>
    </Layout>
  )
}
