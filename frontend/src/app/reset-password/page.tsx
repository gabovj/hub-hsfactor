"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import api from "@/lib/api"

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError("Las contraseñas no coinciden")
      return
    }
    setError("")
    setLoading(true)
    try {
      await api.post("/auth/reset-password", { token, new_password: password })
      router.replace("/login")
    } catch {
      setError("El enlace es inválido o ya expiró")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Nueva contraseña</h1>
          <p className="text-sm text-white/40 mt-1">Elige una contraseña segura.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#FE5915]/60 focus:ring-1 focus:ring-[#FE5915]/30 transition"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Confirmar contraseña</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-[#FE5915]/60 focus:ring-1 focus:ring-[#FE5915]/30 transition"
              placeholder="Repite la contraseña"
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
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </div>
    </div>
  )
}
