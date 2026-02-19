// src/pages/AddExpense.tsx
import Layout from "../components/Layout"
import { useState } from "react"
import { auth, db } from "../firebase"
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, Timestamp } from "firebase/firestore"

export default function AddExpensePage() {
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState<number | "">("")

  const handleAddExpense = async () => {
    if (!auth.currentUser) return
    if (!category || !amount || amount <= 0) return

    const uid = auth.currentUser.uid
    const userDocRef = doc(db, "users", uid)

    try {
      // 1️⃣ Add the expense transaction
      await addDoc(collection(db, "users", uid, "transactions"), {
        amount: Number(amount),
        category,
        type: "debit",
        date: Timestamp.now()
      })

      // 2️⃣ Update totals and budgetLeft
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

      // 3️⃣ Calculate Top Category
      const txSnapshot = await getDocs(collection(db, "users", uid, "transactions"))
      const catTotals: Record<string, number> = {}
      txSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.type === "debit") {
          const cat = data.category ?? "Uncategorized"
          const amt = Number(data.amount ?? 0)
          catTotals[cat] = (catTotals[cat] || 0) + amt
        }
      })
      const newTopCategory = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A"

      // 4️⃣ Update user doc
      await updateDoc(userDocRef, {
        totalExpenses: newTotalExpenses,
        budgetLeft: newBudgetLeft,
        recentTransaction: `${category}: ₱${amount}`,
        topCategory: newTopCategory
      })

      // 5️⃣ Reset form
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
