// Helpers de autenticación — se implementan en Fase 6
// Por ahora solo exporta los tipos que usarán las páginas

export type UserRole = "superadmin" | "coordinador" | "vendedor"

export type CurrentUser = {
  id: string
  email: string
  role: UserRole
}
