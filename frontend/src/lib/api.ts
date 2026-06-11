import axios from "axios"
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "./tokens"

const api = axios.create({
  baseURL: "/api-proxy",
})

let accessToken: string | null = null
let refreshPromise: Promise<string> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

async function doRefresh(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error("No refresh token")

  const { data } = await axios.post("/api-proxy/auth/refresh", {
    refresh_token: refreshToken,
  })

  setAccessToken(data.access_token)
  setRefreshToken(data.refresh_token)
  return data.access_token
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = doRefresh().finally(() => {
            refreshPromise = null
          })
        }
        const newToken = await refreshPromise
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        clearRefreshToken()
        setAccessToken(null)
        window.location.href = "/login"
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

export default api
