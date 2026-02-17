import Sidebar from "../components/Sidebar"
import Navbar from "../components/Navbar"
import GlassCard from "../components/GlassCard"
import ChartPlaceholder from "../components/Chart"

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 flex-1">
          {/* Dashboard cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <GlassCard title="Total Expenses" value="₱12,450" />
            <GlassCard title="Budget Left" value="₱7,550" />
            <GlassCard title="Top Category" value="Food" />
            <GlassCard title="Recent Transaction" value="₱350" />
          </div>

          {/* Chart */}
          <ChartPlaceholder />
        </main>
      </div>
    </div>
  )
}
