"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { Navigation } from "@/components/navigation"
import { DashboardStatsCards } from "@/components/dashboard-stats"
import { RecentActivity } from "@/components/recent-activity"
import { InventorySystem } from "@/components/inventory-system"
import { POSSystem } from "@/components/pos-system"
import { CustomerManagement } from "@/components/customer-management"
import { ReportsSystem } from "@/components/reports-system"

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const { isAuthenticated, login } = useAuth()

  console.log("[v0] HomePage: isAuthenticated =", isAuthenticated)
  console.log("[v0] HomePage: Renderizando componente...")

  if (!isAuthenticated) {
    console.log("[v0] HomePage: Usuario no autenticado, mostrando LoginForm")
    console.log("[v0] HomePage: RETORNANDO LoginForm ahora")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        <div className="w-full max-w-md">
          <LoginForm onLogin={login} />
        </div>
      </div>
    )
  }

  console.log("[v0] HomePage: Usuario autenticado, mostrando dashboard")

  const renderContent = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Resumen general de tu pescadería</p>
            </div>

            <DashboardStatsCards />

            <RecentActivity />
          </div>
        )

      case "inventario":
        return <InventorySystem />

      case "ventas":
        return <POSSystem />

      case "clientes":
        return <CustomerManagement />

      case "reportes":
        return <ReportsSystem />

      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="flex-1 lg:ml-0">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">{renderContent()}</div>
      </main>
    </div>
  )
}
