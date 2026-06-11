const REFRESH_KEY = "hub_refresh_token"

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_KEY)
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token)
}

export function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_KEY)
}
