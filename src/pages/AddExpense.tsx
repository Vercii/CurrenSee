// src/pages/AddExpense.tsx
import Layout from "../components/Layout"
import { useState } from "react"
import { auth, db } from "../firebase"
import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs } from "firebase/firestore"

export default function AddExpensePage() {
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState<number | "">("")

  const handleAddExpense = async () => {
    if (!auth.currentUser) return
    if (!category || !amount || amount <= 0) return

    const uid = auth.currentUser.uid
    const userDocRef = doc(db, "users", uid)

    try {
      // 1️⃣ Add new expense document
      await addDoc(collection(db, "expenses"), {
        userId: uid,
        category,
        amount,
        type: "debit",
        date: new Date()
      })

      // 2️⃣ Recalculate totals for dashboard fields
      const q = query(collection(db, "expenses"), where("userId", "==", uid))
      const snapshot = await getDocs(q)

      let totalExpenses = 0
      const catMap: Record<string, number> = {}
      let recentTransaction = ""

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        const amt = Number(data.amount ?? 0)
        const typ = data.type ?? "debit"
        const cat = data.category ?? "Uncategorized"

        if (typ === "debit") {
          totalExpenses += amt
          catMap[cat] = (catMap[cat] || 0) + amt
        }
      })

      // Most recent transaction
      const sortedTx = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as { id: string; date?: any; category?: string; amount?: number }))
        .sort((a, b) => (b.date?.toMillis?.() ?? 0) - (a.date?.toMillis?.() ?? 0))

      if (sortedTx.length > 0) {
        const last = sortedTx[0]
        recentTransaction = `${last.category}: ₱${last.amount}`
      }

      // Top category
      const topCategory =
        Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A"

      // 3️⃣ Update user document with totals
      const userDocSnap = await getDoc(userDocRef)
      let currentBudget = 50000
      if (userDocSnap.exists()) {
        currentBudget = userDocSnap.data().budget ?? 50000
      }

      await updateDoc(userDocRef, {
        totalExpenses,
        recentTransaction,
        topCategory,
        budget: currentBudget - amount // subtract expense
      })

      // Reset form fields
      setCategory("")
      setAmount("")
    } catch (err) {
      console.error("Failed to add expense:", err)
      alert("Error adding expense: " + err)
    }
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Add Expense</h1>

        <div className="max-w-md mx-auto">
          <label className="block text-white/80 mb-2">Category</label>
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mb-4 p-2 rounded border border-white/20 bg-black/20 text-white"
          />

          <label className="block text-white/80 mb-2">Amount</label>
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full mb-4 p-2 rounded border border-white/20 bg-black/20 text-white"
          />

          <button
            onClick={handleAddExpense}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded transition"
          >
            Add Expense
          </button>
        </div>
      </div>
    </Layout>
  )
}
