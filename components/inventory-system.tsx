"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Search, Edit, Trash2, Package } from "lucide-react"
import { db } from "@/lib/database"
import {
  formatCurrency,
  formatDate,
  generateId,
  getCategoryColor,
  getStockStatus,
  isExpiringSoon,
  isExpired,
} from "@/lib/utils-pescaderia"
import type { Product } from "@/lib/types"

export function InventorySystem() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    category: "pescado",
    price: 0,
    stock: 0,
    unit: "kg",
    expiryDate: "",
    supplier: "",
    minStock: 0,
    description: "",
  })

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, categoryFilter, stockFilter])

  const loadProducts = () => {
    const allProducts = db.getProducts()
    setProducts(allProducts)
  }

  const filterProducts = () => {
    let filtered = products

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.supplier.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por categoría
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    // Filtro por stock
    if (stockFilter === "low") {
      filtered = filtered.filter((product) => product.stock <= product.minStock)
    } else if (stockFilter === "expiring") {
      filtered = filtered.filter((product) => isExpiringSoon(product.expiryDate) || isExpired(product.expiryDate))
    }

    setFilteredProducts(filtered)
  }

  const handleSaveProduct = () => {
    if (!formData.name || !formData.price || !formData.stock || !formData.expiryDate) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    const productData: Product = {
      id: editingProduct?.id || generateId(),
      name: formData.name!,
      category: formData.category as Product["category"],
      price: Number(formData.price),
      stock: Number(formData.stock),
      unit: formData.unit as Product["unit"],
      expiryDate: formData.expiryDate!,
      supplier: formData.supplier!,
      minStock: Number(formData.minStock),
      description: formData.description,
    }

    db.saveProduct(productData)
    loadProducts()
    resetForm()
    setIsAddDialogOpen(false)
    setEditingProduct(null)
  }

  const handleEditProduct = (product: Product) => {
    setFormData(product)
    setEditingProduct(product)
    setIsAddDialogOpen(true)
  }

  const handleDeleteProduct = (id: string) => {
    db.deleteProduct(id)
    loadProducts()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "pescado",
      price: 0,
      stock: 0,
      unit: "kg",
      expiryDate: "",
      supplier: "",
      minStock: 0,
      description: "",
    })
  }

  const getAlertBadge = (product: Product) => {
    const stockStatus = getStockStatus(product)
    const isExpiring = isExpiringSoon(product.expiryDate)
    const expired = isExpired(product.expiryDate)

    if (expired) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    if (isExpiring) {
      return (
        <Badge variant="outline" className="border-orange-300 text-orange-700">
          Por vencer
        </Badge>
      )
    }
    if (stockStatus.status === "low") {
      return <Badge variant="destructive">Stock bajo</Badge>
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventario</h2>
          <p className="text-muted-foreground">Gestiona tus productos y stock</p>
        </div>

        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (!open) {
              setEditingProduct(null)
              resetForm()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Salmón fresco"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as Product["category"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pescado">Pescado</SelectItem>
                    <SelectItem value="marisco">Marisco</SelectItem>
                    <SelectItem value="conserva">Conserva</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unidad</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData({ ...formData, unit: value as Product["unit"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogramo</SelectItem>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="bandeja">Bandeja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Fecha de Vencimiento *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Proveedor *</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Ej: Pescados del Norte"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción opcional del producto"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveProduct} className="bg-blue-600 hover:bg-blue-700">
                {editingProduct ? "Actualizar" : "Guardar"}
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
                  placeholder="Buscar productos o proveedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="pescado">Pescado</SelectItem>
                <SelectItem value="marisco">Marisco</SelectItem>
                <SelectItem value="conserva">Conserva</SelectItem>
                <SelectItem value="otros">Otros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                <SelectItem value="low">Stock bajo</SelectItem>
                <SelectItem value="expiring">Por vencer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product)
          const alertBadge = getAlertBadge(product)

          return (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCategoryColor(product.category)}>{product.category}</Badge>
                      {alertBadge}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
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
                          <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El producto "{product.name}" será eliminado
                            permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProduct(product.id)}
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Precio:</span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(product.price)}/{product.unit}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stock:</span>
                    <span className={`font-semibold ${stockStatus.color}`}>
                      {product.stock} {product.unit}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Vence:</span>
                    <span
                      className={`text-sm ${isExpiringSoon(product.expiryDate) ? "text-orange-600 font-medium" : isExpired(product.expiryDate) ? "text-red-600 font-medium" : ""}`}
                    >
                      {formatDate(product.expiryDate)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Proveedor:</span>
                    <span className="text-sm">{product.supplier}</span>
                  </div>

                  {product.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "all" || stockFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza agregando tu primer producto al inventario"}
            </p>
            {!searchTerm && categoryFilter === "all" && stockFilter === "all" && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Producto
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
