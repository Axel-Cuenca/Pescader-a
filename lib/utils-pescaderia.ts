import type { Product, DashboardStats } from "./types"
import { db } from "./database"

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function isExpiringSoon(expiryDate: string, days = 3): boolean {
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= days && diffDays >= 0
}

export function isExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate)
  const today = new Date()
  return expiry < today
}

export function getDashboardStats(): DashboardStats {
  const products = db.getProducts()
  const sales = db.getSales()
  const customers = db.getCustomers()

  const today = new Date().toISOString().split("T")[0]
  const dailySales = sales.filter((sale) => sale.date.startsWith(today)).reduce((sum, sale) => sum + sale.total, 0)

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)

  const lowStockItems = products.filter((p) => p.stock <= p.minStock).length

  const expiringItems = products.filter((p) => isExpiringSoon(p.expiryDate) || isExpired(p.expiryDate)).length

  return {
    totalSales,
    dailySales,
    lowStockItems,
    totalCustomers: customers.length,
    expiringItems,
  }
}

export function getCategoryColor(category: Product["category"]): string {
  const colors = {
    pescado: "bg-blue-100 text-blue-800",
    marisco: "bg-orange-100 text-orange-800",
    conserva: "bg-green-100 text-green-800",
    otros: "bg-gray-100 text-gray-800",
  }
  return colors[category]
}

export function getStockStatus(product: Product): {
  status: "low" | "normal" | "high"
  color: string
} {
  if (product.stock <= product.minStock) {
    return { status: "low", color: "text-red-600" }
  } else if (product.stock <= product.minStock * 2) {
    return { status: "normal", color: "text-yellow-600" }
  } else {
    return { status: "high", color: "text-green-600" }
  }
}
