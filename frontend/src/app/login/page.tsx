"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/auth"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      router.replace("/dashboard")
    } catch {
      setError("Email o contraseña incorrectos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center flex flex-col items-center">
          <Image src="/hsf-logo.png" alt="HS Factor" width={140} height={27} className="object-contain mb-4" priority />
          <p className="text-sm text-white/40">Plataforma interna</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#FE5915]/60 focus:ring-1 focus:ring-[#FE5915]/30 transition placeholder-white/20"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-white/70">Contraseña</label>
              <Link href="/forgot-password" className="text-xs text-[#FE5915]/80 hover:text-[#FE5915] transition">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#FE5915]/60 focus:ring-1 focus:ring-[#FE5915]/30 transition"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3.5 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FE5915] hover:bg-[#e84d0e] disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm transition"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  )
}
