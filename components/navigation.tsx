"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Menu, Fish, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inventario", label: "Inventario", icon: Package },
  { id: "ventas", label: "Punto de Venta", icon: ShoppingCart },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "reportes", label: "Reportes", icon: BarChart3 },
]

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-6 border-b">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Fish className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Pescadería</h2>
          <p className="text-sm text-muted-foreground">Sistema de Gestión</p>
        </div>
      </div>

      {user && (
        <div className="p-4 border-b bg-gray-50">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
        </div>
      )}

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${isActive ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                onClick={() => {
                  onPageChange(item.id)
                  setIsOpen(false)
                }}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 bg-transparent">
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:block w-80 border-r bg-card">
        <NavContent />
      </div>
    </>
  )
}
