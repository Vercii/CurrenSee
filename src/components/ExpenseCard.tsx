import { useEffect, useState } from "react"
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  Timestamp
} from "firebase/firestore"
import { db, auth } from "../firebase"
import { Expense } from "../types"

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch expenses live
  useEffect(() => {
    if (!auth.currentUser) return

    const q = query(
      collection(db, "expenses"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("date", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Expense[]
      setExpenses(data)
    })

    return () => unsubscribe()
  }, [])

  // Add expense
  const handleAdd = async () => {
    if (!amount || !category) return alert("Amount & Category required")
    setLoading(true)
    try {
      await addDoc(collection(db, "expenses"), {
        userId: auth.currentUser?.uid,
        amount: Number(amount),
        category,
        date: Timestamp.now().toDate().toISOString()
      })
      setAmount("")
      setCategory("")
    } catch (err: any) {
      alert("Error adding expense: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Delete expense
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "expenses", id))
  }

  return (
    <div className="mt-6 p-4 bg-black/20 backdrop-blur-md rounded-xl border border-white/10">
      <h3 className="text-white font-semibold mb-4">Your Expenses</h3>

      <div className="flex gap-2 mb-4">
        <input
          type="number"
          placeholder="Amount"
          className="p-2 rounded-md bg-white/5 text-white flex-1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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
          Add
        </button>
      </div>

      <div className="overflow-y-auto max-h-64">
        {expenses.map((e) => (
          <div
            key={e.id}
            className="flex justify-between items-center p-2 mb-2 bg-black/10 rounded-md hover:bg-purple-400/10 transition"
          >
            <span>
              {e.category}: ₱{e.amount} (
              {new Date(e.date).toLocaleDateString()})
            </span>
            <button
              onClick={() => e.id && handleDelete(e.id)}
              className="text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
