"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/database"
import { formatCurrency, formatDate, isExpiringSoon, getStockStatus } from "@/lib/utils-pescaderia"
import type { Sale, Product } from "@/lib/types"
import { Clock, ShoppingBag, Package, AlertTriangle } from "lucide-react"

export function RecentActivity() {
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([])

  useEffect(() => {
    const loadData = () => {
      const sales = db.getSales().slice(-5).reverse()
      const products = db.getProducts()

      const lowStock = products.filter((p) => p.stock <= p.minStock)
      const expiring = products.filter((p) => isExpiringSoon(p.expiryDate))

      setRecentSales(sales)
      setLowStockProducts(lowStock)
      setExpiringProducts(expiring)
    }

    loadData()
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Ventas Recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            Ventas Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay ventas recientes</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{sale.customerName || "Cliente Anónimo"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(sale.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(sale.total)}</p>
                    <Badge variant={sale.status === "completada" ? "default" : "secondary"}>{sale.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Bajo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-red-600" />
            Stock Bajo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Todo el stock está bien</p>
            ) : (
              lowStockProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Mínimo: {product.minStock} {product.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${stockStatus.color}`}>
                        {product.stock} {product.unit}
                      </p>
                      <Badge variant="destructive">Reponer</Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Productos por Vencer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Por Vencer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expiringProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay productos próximos a vencer</p>
            ) : (
              expiringProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stock: {product.stock} {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">{formatDate(product.expiryDate)}</p>
                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                      Urgente
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
