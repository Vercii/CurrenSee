// src/pages/AddExpense.tsx
import Layout from "../components/Layout"
import ExpenseList from "../components/ExpenseCard"
import { useState, useEffect } from "react"
import { addDoc, collection, Timestamp } from "firebase/firestore"
import { db, auth } from "../firebase"
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"

export default function AddExpense() {
  const [amount, setAmount] = useState<number | "">("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // ----------------------------
  // Track logged-in user safely
  // ----------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoadingUser(false)
    })

    return () => unsubscribe()
  }, [])

  const handleAdd = async () => {
    if (!user) return alert("You must be logged in")
    if (!amount || !category) return alert("Amount & Category required")

    setLoading(true)
    try {
      await addDoc(collection(db, "expenses"), {
        userId: user.uid,
        amount: Number(amount),
        category,
        date: Timestamp.now()
      })

      // Clear the form
      setAmount("")
      setCategory("")
    } catch (err: any) {
      alert("Error adding expense: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingUser) return <Layout>Loading...</Layout>
  if (!user) return <Layout>Please login to add expenses</Layout>

  return (
    <Layout>
      <h1 className="text-4xl font-bold mb-6">Add Expense</h1>

      {/* Form */}
      <div className="flex gap-5 mb-6 max-w-md">
        <input
          type="number"
          placeholder="Amount"
          className="p-2 rounded-md bg-white/5 text-white flex-1"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <input
          type="text"
          placeholder="Category"
          className="p-2 rounded-md bg-white/5 text-white flex-1"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-purple-400/30 hover:bg-purple-400/50 transition"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </Layout>
  )
}
