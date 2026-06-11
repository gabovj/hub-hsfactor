"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import api, { getAccessToken, setAccessToken } from "@/lib/api"
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "@/lib/tokens"

export type UserRole = "superadmin" | "coordinador" | "vendedor"

export type CurrentUser = {
  id: string
  email: string
  role: UserRole
  is_active: boolean
}

type AuthState = {
  user: CurrentUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const { data } = await api.get<CurrentUser>("/auth/me")
    setUser(data)
  }, [])

  useEffect(() => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      setIsLoading(false)
      return
    }

    // Restaurar sesión con el refresh token
    api
      .post("/auth/refresh", { refresh_token: refreshToken })
      .then(({ data }) => {
        setAccessToken(data.access_token)
        setRefreshToken(data.refresh_token)
        return fetchMe()
      })
      .catch(() => {
        clearRefreshToken()
      })
      .finally(() => setIsLoading(false))
  }, [fetchMe])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password })
    setAccessToken(data.access_token)
    setRefreshToken(data.refresh_token)
    await fetchMe()
  }, [fetchMe])

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } catch {
      // ignorar errores de red en logout
    } finally {
      setAccessToken(null)
      clearRefreshToken()
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
