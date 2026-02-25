// src/pages/AddBudget.tsx

import Layout from "../components/Layout.js"
import GlassCard from "../components/GlassCard.js"
import { useState, useRef, useEffect } from "react"
import { db, auth } from "../firebase.js"
import { addDoc, collection, Timestamp, doc, getDoc, updateDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"

const sources = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Salary",
  "Allowance",
  "Other"
]

function GlassDropdown({
  value,
  onChange
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () =>
      document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="p-3 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white cursor-pointer flex justify-between items-center transition hover:ring-2 hover:ring-green-400"
        onClick={() => setOpen(!open)}
      >
        {value || "Select source"}
        <span>{open ? "▲" : "▼"}</span>
      </div>

      <div
        className={`absolute z-10 w-full mt-1 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 shadow-lg max-h-48 overflow-y-auto transform transition-all duration-200 origin-top ${
          open
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        {sources.map((src) => (
          <div
            key={src}
            className={`p-2 cursor-pointer transition hover:bg-white/10 ${
              value === src ? "bg-white/20 font-semibold" : ""
            }`}
            onClick={() => {
              onChange(src)
              setOpen(false)
            }}
          >
            {src}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AddBudget() {
  const navigate = useNavigate()

  const [amount, setAmount] = useState("")
  const [source, setSource] = useState("Cash")
  const [note, setNote] = useState("")
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser) return
    if (!amount || Number(amount) <= 0) return

    setLoading(true)

    try {
      const uid = auth.currentUser.uid
      const userDocRef = doc(db, "users", uid)

      // 1️⃣ Add to budgets collection
      await addDoc(collection(db, "budgets"), {
        userId: uid,
        amount: Number(amount),
        source,
        note,
        date: Timestamp.fromDate(new Date(date)),
        createdAt: Timestamp.now(),
      })

      // 2️⃣ Update user doc and create a transaction like Dashboard
      const userDocSnap = await getDoc(userDocRef)
      let currentBudget = 0
      let totalExpenses = 0

      if (userDocSnap.exists()) {
        const data = userDocSnap.data()
        currentBudget = data.budget ?? 0
        totalExpenses = data.totalExpenses ?? 0
      }

      const newBudget = currentBudget + Number(amount)
      const newBudgetLeft = newBudget - totalExpenses

      // Update user doc
      await updateDoc(userDocRef, {
        budget: newBudget,
        budgetLeft: newBudgetLeft,
        recentTransaction: `Budget Added (${source}): +₱${amount}`
      })

      // Add transaction with source as category
      await addDoc(collection(db, "users", uid, "transactions"), {
        amount: Number(amount),
        category: `Budget Added (${source})`, // <-- include source here
        type: "credit",
        date: Timestamp.now()
      })

      // Clear form
      setAmount("")
      setSource("Cash")
      setNote("")
      setDate(new Date().toISOString().split("T")[0])

    } catch (err) {
      console.error("Error adding budget:", err)
      alert("Failed to add budget: " + err)
    }

    setLoading(false)
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto mt-12 px-4">
        <GlassCard title="" value="">
          <h2 className="text-2xl font-bold mb-8 text-center text-white">
            Add Budget
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6 text-white">
            {/* Amount */}
            <div>
              <label className="block mb-2 text-sm font-medium text-white/80">
                Amount
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full p-3 rounded-xl 
                bg-white/10 backdrop-blur-md
                border border-white/20
                text-white placeholder-white/50
                focus:outline-none focus:ring-2 focus:ring-green-400
                transition"
              />
            </div>

            {/* Source */}
            <div>
              <label className="block mb-2 text-sm font-medium text-white/80">
                Source
              </label>
              <GlassDropdown value={source} onChange={setSource} />
            </div>

            {/* Date */}
            <div>
              <label className="block mb-2 text-sm font-medium text-white/80">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-xl 
                bg-white/10 backdrop-blur-md
                border border-white/20
                text-white
                focus:outline-none focus:ring-2 focus:ring-green-400
                transition"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block mb-2 text-sm font-medium text-white/80">
                Notes (optional)
              </label>
              <textarea
                placeholder="Where did this budget come from?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl 
                bg-white/10 backdrop-blur-md
                border border-white/20
                text-white placeholder-white/50
                focus:outline-none focus:ring-2 focus:ring-green-400
                transition resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl 
              bg-gradient-to-r from-green-400 to-emerald-500
              hover:from-green-500 hover:to-emerald-600
              text-white font-semibold
              shadow-lg shadow-green-500/30
              transition duration-300"
            >
              {loading ? "Adding..." : "Add Budget"}
            </button>
          </form>
        </GlassCard>
      </div>
    </Layout>
  )
}