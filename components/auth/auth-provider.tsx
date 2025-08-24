"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type AuthState, authService } from "@/lib/auth"

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("[v0] AuthProvider: Inicializando autenticación...")
    const user = authService.getCurrentUser()
    console.log("[v0] AuthProvider: Usuario encontrado:", user)
    console.log("[v0] AuthProvider: localStorage auth_user:", localStorage.getItem("auth_user"))

    setAuthState({
      user,
      isAuthenticated: !!user,
    })
    setIsLoading(false)

    console.log("[v0] AuthProvider: Estado final - isAuthenticated:", !!user)
  }, [])

  const login = (username: string, password: string): boolean => {
    console.log("[v0] AuthProvider: Intentando login con usuario:", username)
    const user = authService.login(username, password)
    if (user) {
      console.log("[v0] AuthProvider: Login exitoso:", user)
      setAuthState({
        user,
        isAuthenticated: true,
      })
      return true
    }
    console.log("[v0] AuthProvider: Login fallido")
    return false
  }

  const logout = () => {
    console.log("[v0] AuthProvider: Cerrando sesión...")
    authService.logout()
    setAuthState({
      user: null,
      isAuthenticated: false,
    })
    console.log("[v0] AuthProvider: Sesión cerrada")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={{ ...authState, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
