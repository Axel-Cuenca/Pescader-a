"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Star,
  ShoppingBag,
  Calendar,
  TrendingUp,
} from "lucide-react"
import { db } from "@/lib/database"
import { formatCurrency, formatDate, generateId } from "@/lib/utils-pescaderia"
import type { Customer, Sale } from "@/lib/types"

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "vip" | "regular">("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    isVip: false,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [customers, searchTerm, filterType])

  const loadData = () => {
    const allCustomers = db.getCustomers()
    const allSales = db.getSales()
    setCustomers(allCustomers)
    setSales(allSales)
  }

  const filterCustomers = () => {
    let filtered = customers

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm),
      )
    }

    // Filtro por tipo
    if (filterType === "vip") {
      filtered = filtered.filter((customer) => customer.isVip)
    } else if (filterType === "regular") {
      filtered = filtered.filter((customer) => !customer.isVip)
    }

    // Ordenar por total de compras (descendente)
    filtered.sort((a, b) => b.totalPurchases - a.totalPurchases)

    setFilteredCustomers(filtered)
  }

  const handleSaveCustomer = () => {
    if (!formData.name) {
      alert("El nombre es obligatorio")
      return
    }

    const customerData: Customer = {
      id: editingCustomer?.id || generateId(),
      name: formData.name!,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      totalPurchases: editingCustomer?.totalPurchases || 0,
      lastPurchase: editingCustomer?.lastPurchase,
      isVip: formData.isVip || false,
    }

    db.saveCustomer(customerData)
    loadData()
    resetForm()
    setIsAddDialogOpen(false)
    setEditingCustomer(null)
  }

  const handleEditCustomer = (customer: Customer) => {
    setFormData(customer)
    setEditingCustomer(customer)
    setIsAddDialogOpen(true)
  }

  const handleDeleteCustomer = (id: string) => {
    db.deleteCustomer?.(id) // Asumir que existe este método
    loadData()
  }

  const handleViewCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDetailDialogOpen(true)
  }

  const toggleVipStatus = (customer: Customer) => {
    const updatedCustomer = {
      ...customer,
      isVip: !customer.isVip,
    }
    db.saveCustomer(updatedCustomer)
    loadData()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      isVip: false,
    })
  }

  const getCustomerSales = (customerId: string) => {
    return sales.filter((sale) => sale.customerId === customerId)
  }

  const getCustomerStats = (customer: Customer) => {
    const customerSales = getCustomerSales(customer.id)
    const totalSales = customerSales.length
    const avgPurchase = totalSales > 0 ? customer.totalPurchases / totalSales : 0

    return {
      totalSales,
      avgPurchase,
      lastPurchaseDate: customer.lastPurchase ? new Date(customer.lastPurchase) : null,
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Clientes</h2>
          <p className="text-muted-foreground">Administra tu base de clientes</p>
        </div>

        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              setEditingCustomer(null)
              resetForm()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Editar Cliente" : "Agregar Nuevo Cliente"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="666 123 456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="vip"
                  checked={formData.isVip}
                  onCheckedChange={(checked) => setFormData({ ...formData, isVip: checked })}
                />
                <Label htmlFor="vip" className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Cliente VIP
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCustomer} className="bg-blue-600 hover:bg-blue-700">
                {editingCustomer ? "Actualizar" : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                size="sm"
              >
                Todos ({customers.length})
              </Button>
              <Button
                variant={filterType === "vip" ? "default" : "outline"}
                onClick={() => setFilterType("vip")}
                size="sm"
                className="flex items-center gap-1"
              >
                <Star className="w-3 h-3" />
                VIP ({customers.filter((c) => c.isVip).length})
              </Button>
              <Button
                variant={filterType === "regular" ? "default" : "outline"}
                onClick={() => setFilterType("regular")}
                size="sm"
              >
                Regulares ({customers.filter((c) => !c.isVip).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => {
          const stats = getCustomerStats(customer)

          return (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {customer.name}
                      {customer.isVip && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={customer.isVip ? "default" : "secondary"}>
                        {customer.isVip ? "VIP" : "Regular"}
                      </Badge>
                      <Badge variant="outline">{stats.totalSales} compras</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditCustomer(customer)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El cliente "{customer.name}" será eliminado
                            permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}

                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{customer.address}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Compras</p>
                      <p className="font-semibold text-green-600">{formatCurrency(customer.totalPurchases)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Promedio</p>
                      <p className="font-semibold">{formatCurrency(stats.avgPurchase)}</p>
                    </div>
                  </div>

                  {customer.lastPurchase && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Última compra: {formatDate(customer.lastPurchase)}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCustomerDetail(customer)}
                      className="flex-1"
                    >
                      Ver Detalle
                    </Button>
                    <Button
                      variant={customer.isVip ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVipStatus(customer)}
                      className="flex items-center gap-1"
                    >
                      <Star className="w-3 h-3" />
                      {customer.isVip ? "Quitar VIP" : "Hacer VIP"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron clientes</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza agregando tu primer cliente"}
            </p>
            {!searchTerm && filterType === "all" && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de detalle del cliente */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedCustomer?.name}
              {selectedCustomer?.isVip && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="history">Historial de Compras</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-sm">{selectedCustomer.email || "No especificado"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                    <p className="text-sm">{selectedCustomer.phone || "No especificado"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Dirección</Label>
                    <p className="text-sm">{selectedCustomer.address || "No especificada"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <Label className="text-sm font-medium">Total Compras</Label>
                    </div>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedCustomer.totalPurchases)}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                      <Label className="text-sm font-medium">Num. Compras</Label>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{getCustomerSales(selectedCustomer.id).length}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <Label className="text-sm font-medium">Última Compra</Label>
                    </div>
                    <p className="text-sm font-medium">
                      {selectedCustomer.lastPurchase ? formatDate(selectedCustomer.lastPurchase) : "Nunca"}
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="history" className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {getCustomerSales(selectedCustomer.id).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay compras registradas</p>
                  ) : (
                    getCustomerSales(selectedCustomer.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((sale) => (
                        <Card key={sale.id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">Venta #{sale.id.slice(-8)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(sale.date).toLocaleString("es-ES")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">{formatCurrency(sale.total)}</p>
                                <Badge variant="outline" className="capitalize">
                                  {sale.paymentMethod}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {sale.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>
                                    {item.quantity}x {item.productName}
                                  </span>
                                  <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
