export interface User {
  id: string
  username: string
  name: string
  role: "admin" | "employee"
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

// Usuarios predeterminados para demo
const DEFAULT_USERS = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    name: "Administrador",
    role: "admin" as const,
  },
  {
    id: "2",
    username: "empleado",
    password: "emp123",
    name: "Empleado",
    role: "employee" as const,
  },
]

export const authService = {
  login: (username: string, password: string): User | null => {
    console.log("[v0] authService: Intentando login con:", username)
    const user = DEFAULT_USERS.find((u) => u.username === username && u.password === password)
    if (user) {
      const authUser = { id: user.id, username: user.username, name: user.name, role: user.role }
      localStorage.setItem("auth_user", JSON.stringify(authUser))
      console.log("[v0] authService: Usuario guardado en localStorage:", authUser)
      return authUser
    }
    console.log("[v0] authService: Credenciales inválidas")
    return null
  },

  logout: () => {
    console.log("[v0] authService: Eliminando usuario de localStorage")
    localStorage.removeItem("auth_user")
  },

  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") {
      console.log("[v0] authService: Ejecutándose en servidor, retornando null")
      return null
    }
    const stored = localStorage.getItem("auth_user")
    console.log("[v0] authService: Datos en localStorage:", stored)
    const user = stored ? JSON.parse(stored) : null
    console.log("[v0] authService: Usuario parseado:", user)
    return user
  },

  isAuthenticated: (): boolean => {
    return authService.getCurrentUser() !== null
  },
}
