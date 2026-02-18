// src/pages/AddExpense.tsx
import { useState } from "react"
import { auth, db } from "../firebase"
import { collection, addDoc, doc, updateDoc, getDoc, Timestamp } from "firebase/firestore"
import Layout from "../components/Layout"

export default function AddExpense() {
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState<number | "">("")
  const [loading, setLoading] = useState(false)

  const handleAddExpense = async () => {
    if (!auth.currentUser) return
    if (!category || !amount || amount <= 0) return

    setLoading(true)
    try {
      const userId = auth.currentUser.uid
      const userDocRef = doc(db, "users", userId)

      // Fetch current budget
      const userDocSnap = await getDoc(userDocRef)
      let currentBudget = 0
      if (userDocSnap.exists()) {
        currentBudget = userDocSnap.data().budget ?? 0
      }

      // Subtract expense from budget
      const newBudget = currentBudget - amount
      await updateDoc(userDocRef, { budget: newBudget })

      // Add expense transaction with type "debit"
      await addDoc(collection(db, "expenses"), {
        userId,
        category,
        amount,
        type: "debit",
        date: Timestamp.now()
      })

      // Reset inputs
      setCategory("")
      setAmount("")
    } catch (err: any) {
      console.error("Failed to add expense:", err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="mt-6 p-6 bg-black/20 backdrop-blur-md rounded-xl border border-white/10 w-full">
        <h2 className="text-2xl font-bold text-white mb-6">Add Expense</h2>

        <div className="flex flex-col gap-4 w-full">
          <input
            type="text"
            placeholder="Category"
            className="w-full p-3 rounded-md bg-white/5 text-white placeholder-gray-400"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <input
            type="number"
            placeholder="Amount"
            className="w-full p-3 rounded-md bg-white/5 text-white placeholder-gray-400"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />

          <button
            onClick={handleAddExpense}
            disabled={loading}
            className="w-full p-3 rounded-lg bg-purple-400/30 hover:bg-purple-400/50 transition"
          >
            {loading ? "Adding..." : "Add Expense"}
          </button>
        </div>
      </div>
    </Layout>
  )
}
