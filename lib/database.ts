import type { Product, Customer, Sale, Supplier } from "./types"

const STORAGE_KEYS = {
  PRODUCTS: "pescaderia_products",
  CUSTOMERS: "pescaderia_customers",
  SALES: "pescaderia_sales",
  SUPPLIERS: "pescaderia_suppliers",
}

// Datos iniciales de ejemplo
const initialProducts: Product[] = [
  {
    id: "1",
    name: "Salmón Fresco",
    category: "pescado",
    price: 18.5,
    stock: 25,
    unit: "kg",
    expiryDate: "2024-12-20",
    supplier: "Pescados del Norte",
    minStock: 5,
    description: "Salmón fresco del Atlántico",
  },
  {
    id: "2",
    name: "Gambas Rojas",
    category: "marisco",
    price: 24.0,
    stock: 12,
    unit: "kg",
    expiryDate: "2024-12-18",
    supplier: "Mariscos Costa Brava",
    minStock: 3,
    description: "Gambas rojas de primera calidad",
  },
  {
    id: "3",
    name: "Merluza",
    category: "pescado",
    price: 12.8,
    stock: 30,
    unit: "kg",
    expiryDate: "2024-12-19",
    supplier: "Pescados del Norte",
    minStock: 8,
    description: "Merluza fresca nacional",
  },
  {
    id: "4",
    name: "Pulpo Cocido",
    category: "marisco",
    price: 28.0,
    stock: 8,
    unit: "kg",
    expiryDate: "2024-12-21",
    supplier: "Mariscos Costa Brava",
    minStock: 2,
    description: "Pulpo cocido listo para consumir",
  },
]

const initialCustomers: Customer[] = [
  {
    id: "1",
    name: "María García",
    email: "maria@email.com",
    phone: "666123456",
    address: "Calle Mayor 15",
    totalPurchases: 245.8,
    lastPurchase: "2024-12-15",
    isVip: true,
  },
  {
    id: "2",
    name: "Juan Pérez",
    phone: "677987654",
    totalPurchases: 89.5,
    lastPurchase: "2024-12-14",
    isVip: false,
  },
]

const initialSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Pescados del Norte",
    contact: "Antonio López",
    phone: "987654321",
    email: "info@pescadosnorte.com",
    products: ["Salmón", "Merluza", "Bacalao"],
  },
  {
    id: "2",
    name: "Mariscos Costa Brava",
    contact: "Carmen Ruiz",
    phone: "654321987",
    email: "ventas@mariscoscostabrava.com",
    products: ["Gambas", "Pulpo", "Mejillones"],
  },
]

class Database {
  private static instance: Database

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  private constructor() {
    this.initializeData()
  }

  private initializeData() {
    if (typeof window === "undefined") return

    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts))
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers))
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]))
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(initialSuppliers))
    }
  }

  // Productos
  getProducts(): Product[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
    return data ? JSON.parse(data) : []
  }

  saveProduct(product: Product): void {
    const products = this.getProducts()
    const index = products.findIndex((p) => p.id === product.id)
    if (index >= 0) {
      products[index] = product
    } else {
      products.push(product)
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id)
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
  }

  // Clientes
  getCustomers(): Customer[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS)
    return data ? JSON.parse(data) : []
  }

  saveCustomer(customer: Customer): void {
    const customers = this.getCustomers()
    const index = customers.findIndex((c) => c.id === customer.id)
    if (index >= 0) {
      customers[index] = customer
    } else {
      customers.push(customer)
    }
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
  }

  deleteCustomer(id: string): void {
    const customers = this.getCustomers().filter((c) => c.id !== id)
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
  }

  // Ventas
  getSales(): Sale[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.SALES)
    return data ? JSON.parse(data) : []
  }

  saveSale(sale: Sale): void {
    const sales = this.getSales()
    sales.push(sale)
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales))
  }

  // Proveedores
  getSuppliers(): Supplier[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(STORAGE_KEYS.SUPPLIERS)
    return data ? JSON.parse(data) : []
  }

  saveSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers()
    const index = suppliers.findIndex((s) => s.id === supplier.id)
    if (index >= 0) {
      suppliers[index] = supplier
    } else {
      suppliers.push(supplier)
    }
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers))
  }
}

export const db = Database.getInstance()
