"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { BarChart3, PieChartIcon, Download, Users, Package, Euro, ShoppingCart } from "lucide-react"
import { db } from "@/lib/database"
import { formatCurrency, formatDate } from "@/lib/utils-pescaderia"
import type { Sale, Product, Customer } from "@/lib/types"

interface SalesAnalytics {
  totalSales: number
  totalRevenue: number
  avgOrderValue: number
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
  topCustomers: Array<{ name: string; purchases: number; revenue: number }>
  salesByCategory: Array<{ category: string; revenue: number; quantity: number }>
  salesByDay: Array<{ date: string; sales: number; revenue: number }>
  salesByPaymentMethod: Array<{ method: string; count: number; revenue: number }>
}

export function ReportsSystem() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setSales(db.getSales())
    setProducts(db.getProducts())
    setCustomers(db.getCustomers())
  }

  const filteredSales = useMemo(() => {
    let filtered = sales

    if (dateRange !== "all") {
      const days = Number.parseInt(dateRange.replace("d", ""))
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      filtered = filtered.filter((sale) => new Date(sale.date) >= cutoffDate)
    }

    if (startDate && endDate) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.date)
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate)
      })
    }

    return filtered
  }, [sales, dateRange, startDate, endDate])

  const analytics: SalesAnalytics = useMemo(() => {
    const totalSales = filteredSales.length
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0)
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

    // Productos más vendidos
    const productSales = new Map<string, { quantity: number; revenue: number }>()
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productSales.get(item.productName) || { quantity: 0, revenue: 0 }
        productSales.set(item.productName, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.subtotal,
        })
      })
    })

    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Mejores clientes
    const customerSales = new Map<string, { purchases: number; revenue: number }>()
    filteredSales.forEach((sale) => {
      if (sale.customerName) {
        const existing = customerSales.get(sale.customerName) || { purchases: 0, revenue: 0 }
        customerSales.set(sale.customerName, {
          purchases: existing.purchases + 1,
          revenue: existing.revenue + sale.total,
        })
      }
    })

    const topCustomers = Array.from(customerSales.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Ventas por categoría
    const categorySales = new Map<string, { revenue: number; quantity: number }>()
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId)
        if (product) {
          const existing = categorySales.get(product.category) || { revenue: 0, quantity: 0 }
          categorySales.set(product.category, {
            revenue: existing.revenue + item.subtotal,
            quantity: existing.quantity + item.quantity,
          })
        }
      })
    })

    const salesByCategory = Array.from(categorySales.entries()).map(([category, data]) => ({
      category,
      ...data,
    }))

    // Ventas por día
    const dailySales = new Map<string, { sales: number; revenue: number }>()
    filteredSales.forEach((sale) => {
      const date = sale.date.split("T")[0]
      const existing = dailySales.get(date) || { sales: 0, revenue: 0 }
      dailySales.set(date, {
        sales: existing.sales + 1,
        revenue: existing.revenue + sale.total,
      })
    })

    const salesByDay = Array.from(dailySales.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Ventas por método de pago
    const paymentSales = new Map<string, { count: number; revenue: number }>()
    filteredSales.forEach((sale) => {
      const existing = paymentSales.get(sale.paymentMethod) || { count: 0, revenue: 0 }
      paymentSales.set(sale.paymentMethod, {
        count: existing.count + 1,
        revenue: existing.revenue + sale.total,
      })
    })

    const salesByPaymentMethod = Array.from(paymentSales.entries()).map(([method, data]) => ({
      method,
      ...data,
    }))

    return {
      totalSales,
      totalRevenue,
      avgOrderValue,
      topProducts,
      topCustomers,
      salesByCategory,
      salesByDay,
      salesByPaymentMethod,
    }
  }, [filteredSales, products])

  const chartConfig = {
    revenue: {
      label: "Ingresos",
      color: "hsl(var(--chart-1))",
    },
    sales: {
      label: "Ventas",
      color: "hsl(var(--chart-2))",
    },
    quantity: {
      label: "Cantidad",
      color: "hsl(var(--chart-3))",
    },
  }

  const categoryColors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  const exportData = () => {
    const data = {
      period: dateRange,
      analytics,
      generatedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-pescaderia-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h2 className="text-2xl font-bold">Sistema de Reportes</h2>
          <p className="text-muted-foreground">Análisis y estadísticas de tu pescadería</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Período</Label>
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
            </div>
          </div>

          <Button onClick={exportData} variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(analytics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">{analytics.totalSales} ventas en el período seleccionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Valor promedio por venta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Vendidos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.topProducts.reduce((sum, p) => sum + p.quantity, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Unidades totales vendidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics.topCustomers.length}</div>
            <p className="text-xs text-muted-foreground">Clientes que compraron en el período</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con diferentes reportes */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de ventas por día */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Ventas por Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.salesByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
                        }
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} labelFormatter={(value) => formatDate(value)} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        strokeWidth={2}
                        name="Ingresos"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Métodos de pago */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Métodos de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.salesByPaymentMethod}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ method, count }) => `${method}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {analytics.salesByPaymentMethod.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-background border rounded-lg p-2 shadow-md">
                                <p className="font-medium capitalize">{data.method}</p>
                                <p className="text-sm">Ventas: {data.count}</p>
                                <p className="text-sm">Ingresos: {formatCurrency(data.revenue)}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.quantity} unidades vendidas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(product.revenue / product.quantity)}/unidad
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mejores Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCustomers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.purchases} compras realizadas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(customer.revenue)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(customer.revenue / customer.purchases)}/compra
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.salesByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" name="Ingresos" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.salesByCategory.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                        />
                        <div>
                          <p className="font-medium capitalize">{category.category}</p>
                          <p className="text-sm text-muted-foreground">{category.quantity} unidades</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(category.revenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {((category.revenue / analytics.totalRevenue) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
