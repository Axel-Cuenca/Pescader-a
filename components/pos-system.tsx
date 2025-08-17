"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Receipt,
  User,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react"
import { db } from "@/lib/database"
import { formatCurrency, generateId, getCategoryColor } from "@/lib/utils-pescaderia"
import type { Product, Customer, Sale, SaleItem } from "@/lib/types"

interface CartItem extends SaleItem {
  product: Product
}

export function POSSystem() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo")
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm])

  const loadData = () => {
    setProducts(db.getProducts())
    setCustomers(db.getCustomers())
  }

  const filterProducts = () => {
    if (!searchTerm) {
      setFilteredProducts([])
      return
    }

    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredProducts(filtered.slice(0, 8)) // Limitar a 8 resultados
  }

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert("Producto sin stock disponible")
      return
    }

    const existingItem = cart.find((item) => item.productId === product.id)

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert("No hay suficiente stock disponible")
        return
      }
      updateCartItemQuantity(product.id, existingItem.quantity + 1)
    } else {
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        subtotal: product.price,
        product,
      }
      setCart([...cart, newItem])
    }
    setSearchTerm("")
    setFilteredProducts([])
  }

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find((p) => p.id === productId)
    if (product && newQuantity > product.stock) {
      alert("No hay suficiente stock disponible")
      return
    }

    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity, subtotal: item.price * newQuantity } : item,
      ),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0)
  }

  const processSale = () => {
    if (cart.length === 0) {
      alert("El carrito está vacío")
      return
    }

    // Verificar stock disponible
    for (const item of cart) {
      const currentProduct = products.find((p) => p.id === item.productId)
      if (!currentProduct || currentProduct.stock < item.quantity) {
        alert(`Stock insuficiente para ${item.productName}`)
        return
      }
    }

    // Crear la venta
    const sale: Sale = {
      id: generateId(),
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      items: cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
      total: calculateTotal(),
      date: new Date().toISOString(),
      paymentMethod,
      status: "completada",
    }

    // Guardar la venta
    db.saveSale(sale)

    // Actualizar stock de productos
    cart.forEach((item) => {
      const product = products.find((p) => p.id === item.productId)
      if (product) {
        const updatedProduct = {
          ...product,
          stock: product.stock - item.quantity,
        }
        db.saveProduct(updatedProduct)
      }
    })

    // Actualizar cliente si existe
    if (selectedCustomer) {
      const updatedCustomer = {
        ...selectedCustomer,
        totalPurchases: selectedCustomer.totalPurchases + sale.total,
        lastPurchase: sale.date.split("T")[0],
      }
      db.saveCustomer(updatedCustomer)
    }

    setLastSale(sale)
    setIsTicketDialogOpen(true)
    clearCart()
    loadData() // Recargar datos para actualizar stock
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "efectivo":
        return <Banknote className="w-4 h-4" />
      case "tarjeta":
        return <CreditCard className="w-4 h-4" />
      case "transferencia":
        return <Smartphone className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Punto de Venta</h2>
        <p className="text-muted-foreground">Procesa ventas y genera tickets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de productos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Búsqueda de productos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredProducts.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.name}</span>
                          <Badge className={getCategoryColor(product.category)}>{product.category}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            Stock: {product.stock} {product.unit}
                          </span>
                          <span className="font-semibold text-blue-600">
                            {formatCurrency(product.price)}/{product.unit}
                          </span>
                        </div>
                      </div>
                      <Button size="sm" disabled={product.stock <= 0}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel del carrito */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Carrito ({cart.length})
                </div>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">El carrito está vacío</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)}/{item.product.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Finalizar Venta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selección de cliente */}
                <div className="space-y-2">
                  <Label>Cliente (Opcional)</Label>
                  <Select
                    value={selectedCustomer?.id || "default"}
                    onValueChange={(value) => {
                      const customer = customers.find((c) => c.id === value)
                      setSelectedCustomer(customer || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente">
                        {selectedCustomer && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {selectedCustomer.name}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Sin cliente</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {customer.name}
                            {customer.isVip && <Badge variant="secondary">VIP</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Método de pago */}
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    <SelectTrigger>
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(paymentMethod)}
                          {paymentMethod === "efectivo" && "Efectivo"}
                          {paymentMethod === "tarjeta" && "Tarjeta"}
                          {paymentMethod === "transferencia" && "Transferencia"}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo">
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          Efectivo
                        </div>
                      </SelectItem>
                      <SelectItem value="tarjeta">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Tarjeta
                        </div>
                      </SelectItem>
                      <SelectItem value="transferencia">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Transferencia
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-blue-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                <Button onClick={processSale} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                  <Receipt className="w-4 h-4 mr-2" />
                  Procesar Venta
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog del ticket */}
      <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Ticket de Venta</DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4 font-mono text-sm">
              <div className="text-center border-b pb-4">
                <h3 className="font-bold text-lg">PESCADERÍA</h3>
                <p className="text-muted-foreground">Sistema de Gestión</p>
                <p className="text-xs">Ticket: {lastSale.id}</p>
                <p className="text-xs">{new Date(lastSale.date).toLocaleString("es-ES")}</p>
              </div>

              <div className="space-y-2">
                {lastSale.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(lastSale.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Método de pago:</span>
                  <span className="capitalize">{lastSale.paymentMethod}</span>
                </div>
                {lastSale.customerName && (
                  <div className="flex justify-between text-sm">
                    <span>Cliente:</span>
                    <span>{lastSale.customerName}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-muted-foreground border-t pt-4">
                <p>¡Gracias por su compra!</p>
                <p>Vuelva pronto</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsTicketDialogOpen(false)} className="flex-1">
              Cerrar
            </Button>
            <Button
              onClick={() => {
                window.print()
              }}
              className="flex-1"
            >
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
