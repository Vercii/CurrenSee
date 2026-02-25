// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./pages/Dashboard.js"
import Login from "./pages/Login.js"
import Signup from "./pages/Signup.js"
import AddExpense from "./pages/AddExpense.js"
import Reports from "./pages/Expenses.js"
import VerifyEmail from "./pages/VerifyEmail.js"
import ProtectedRoute from "./components/ProtectedRoute.js"

import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "./firebase.js"
import AddBudget from "./pages/AddBudget.js"

export default function App() {
  const [user, loading] = useAuthState(auth)

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    )

  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/" />}
        />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddExpense />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-budget"
          element={
            <ProtectedRoute>
              <AddBudget />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}