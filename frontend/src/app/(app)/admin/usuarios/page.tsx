"use client"

import { useCallback, useEffect, useState } from "react"
import { UserPlus } from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth"
import Modal from "@/components/ui/modal"

type User = {
  id: string
  email: string
  role: "superadmin" | "coordinador" | "vendedor"
  is_active: boolean
  created_at: string
}

const ROLE_LABEL = { superadmin: "Superadmin", coordinador: "Coordinador", vendedor: "Vendedor" }
const ROLE_COLOR = {
  superadmin: "bg-[#FE5915]/15 text-[#FE5915]",
  coordinador: "bg-blue-400/10 text-blue-400",
  vendedor: "bg-green-400/10 text-green-400",
}

export default function UsuariosPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<User["role"]>("vendedor")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")

  const fetchUsers = useCallback(async () => {
    const { data } = await api.get<User[]>("/admin/users")
    setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function handleToggle(id: string) {
    await api.patch(`/admin/users/${id}/toggle-active`)
    fetchUsers()
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError("")
    try {
      await api.post("/auth/invite", { email: inviteEmail, role: inviteRole })
      setShowInvite(false)
      setInviteEmail("")
      setInviteRole("vendedor")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setInviteError(msg ?? "Error al enviar la invitación")
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-white/40 text-sm mt-1">{users.length} usuarios registrados</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-[#FE5915] hover:bg-[#e84d0e] text-black text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          <UserPlus size={16} />
          Invitar usuario
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-[#FE5915]/30 border-t-[#FE5915] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-4 py-3 text-xs font-medium text-white/40">Email</th>
                <th className="px-4 py-3 text-xs font-medium text-white/40">Rol</th>
                <th className="px-4 py-3 text-xs font-medium text-white/40">Estado</th>
                <th className="px-4 py-3 text-xs font-medium text-white/40">Desde</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
                      {u.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {new Date(u.created_at).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== me?.id && (
                      <button
                        onClick={() => handleToggle(u.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          u.is_active
                            ? "border-red-400/20 text-red-400/70 hover:text-red-400 hover:border-red-400/40"
                            : "border-green-400/20 text-green-400/70 hover:text-green-400 hover:border-green-400/40"
                        }`}
                      >
                        {u.is_active ? "Desactivar" : "Activar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInvite && (
        <Modal title="Invitar usuario" onClose={() => setShowInvite(false)}>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Email</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FE5915]/50 transition placeholder-white/20"
                placeholder="usuario@empresa.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Rol</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as User["role"])}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FE5915]/50 transition"
              >
                <option value="vendedor">Vendedor</option>
                <option value="coordinador">Coordinador</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition">
                Cancelar
              </button>
              <button type="submit" disabled={inviteLoading} className="px-4 py-2 bg-[#FE5915] hover:bg-[#e84d0e] disabled:opacity-50 text-black text-sm font-semibold rounded-lg transition">
                {inviteLoading ? "Enviando..." : "Enviar invitación"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
