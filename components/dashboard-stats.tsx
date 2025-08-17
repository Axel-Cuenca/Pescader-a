"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Package, Users, AlertTriangle, Euro } from "lucide-react"
import { getDashboardStats } from "@/lib/utils-pescaderia"
import { formatCurrency } from "@/lib/utils-pescaderia"
import type { DashboardStats } from "@/lib/types"

export function DashboardStatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    const loadStats = () => {
      const dashboardStats = getDashboardStats()
      setStats(dashboardStats)
    }

    loadStats()
    // Actualizar cada 30 segundos
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!stats) {
    return <div>Cargando estadísticas...</div>
  }

  const statsCards = [
    {
      title: "Ventas del Día",
      value: formatCurrency(stats.dailySales),
      icon: Euro,
      trend: stats.dailySales > 0 ? "up" : "neutral",
      color: "text-green-600",
    },
    {
      title: "Ventas Totales",
      value: formatCurrency(stats.totalSales),
      icon: TrendingUp,
      trend: "up",
      color: "text-blue-600",
    },
    {
      title: "Stock Bajo",
      value: stats.lowStockItems.toString(),
      icon: Package,
      trend: stats.lowStockItems > 0 ? "down" : "neutral",
      color: stats.lowStockItems > 0 ? "text-red-600" : "text-green-600",
    },
    {
      title: "Clientes",
      value: stats.totalCustomers.toString(),
      icon: Users,
      trend: "neutral",
      color: "text-blue-600",
    },
    {
      title: "Productos por Vencer",
      value: stats.expiringItems.toString(),
      icon: AlertTriangle,
      trend: stats.expiringItems > 0 ? "down" : "neutral",
      color: stats.expiringItems > 0 ? "text-orange-600" : "text-green-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                {stat.trend === "up" && (
                  <Badge variant="secondary" className="text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Activo
                  </Badge>
                )}
                {stat.trend === "down" && (
                  <Badge variant="destructive">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Atención
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
