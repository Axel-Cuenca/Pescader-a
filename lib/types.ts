export interface Product {
  id: string
  name: string
  category: "pescado" | "marisco" | "conserva" | "otros"
  price: number
  stock: number
  unit: "kg" | "unidad" | "bandeja"
  expiryDate: string
  supplier: string
  minStock: number
  image?: string
  description?: string
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  totalPurchases: number
  lastPurchase?: string
  isVip: boolean
}

export interface Sale {
  id: string
  customerId?: string
  customerName?: string
  items: SaleItem[]
  total: number
  date: string
  paymentMethod: "efectivo" | "tarjeta" | "transferencia"
  status: "completada" | "pendiente" | "cancelada"
}

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export interface Supplier {
  id: string
  name: string
  contact: string
  phone?: string
  email?: string
  products: string[]
}

export interface DashboardStats {
  totalSales: number
  dailySales: number
  lowStockItems: number
  totalCustomers: number
  expiringItems: number
}
