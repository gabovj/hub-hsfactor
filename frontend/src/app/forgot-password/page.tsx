"use client"

import { useState } from "react"
import Link from "next/link"
import api from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/auth/forgot-password", { email })
    } catch {
      // Siempre mostrar éxito para no revelar si el email existe
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link href="/login" className="text-xs text-white/40 hover:text-white/70 transition">
            ← Volver al login
          </Link>
          <h1 className="text-2xl font-bold mt-4">Recuperar contraseña</h1>
          <p className="text-sm text-white/40 mt-1">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        {sent ? (
          <div className="bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3.5 text-sm text-green-400">
            Si tu email está registrado, recibirás un enlace en los próximos minutos.
          </div>
        ) : (
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FE5915] hover:bg-[#e84d0e] disabled:opacity-50 text-black font-semibold rounded-lg py-2.5 text-sm transition"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
