"use client"

import { useCallback, useEffect, useState } from "react"
import { GripVertical, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth"
import Modal from "@/components/ui/modal"

type Tema = {
  id: number
  tema: string
  angulo?: string
  activo: boolean
  orden: number
  created_at: string
  updated_at: string
}

export default function ContenidosPage() {
  const { user } = useAuth()
  const isSuperadmin = user?.role === "superadmin"
  const [temas, setTemas] = useState<Tema[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formTema, setFormTema] = useState("")
  const [formAngulo, setFormAngulo] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchTemas = useCallback(async () => {
    const { data } = await api.get<Tema[]>("/contenidos/temas")
    setTemas(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchTemas() }, [fetchTemas])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post("/contenidos/temas", { tema: formTema, angulo: formAngulo || undefined, activo: false, orden: temas.length })
      setShowForm(false)
      setFormTema("")
      setFormAngulo("")
      fetchTemas()
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(id: number) {
    await api.patch(`/contenidos/temas/${id}/toggle`)
    fetchTemas()
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este tema?")) return
    await api.delete(`/contenidos/temas/${id}`)
    fetchTemas()
  }

  const activos = temas.filter((t) => t.activo)
  const inactivos = temas.filter((t) => !t.activo)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contenidos</h1>
          <p className="text-white/40 text-sm mt-1">{activos.length} temas activos · {temas.length} total</p>
        </div>
        {isSuperadmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#FE5915] hover:bg-[#e84d0e] text-black text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <Plus size={16} />
            Nuevo tema
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-[#FE5915]/30 border-t-[#FE5915] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { label: "Activos", items: activos },
            { label: "Inactivos", items: inactivos },
          ].map(({ label, items }) => (
            items.length > 0 && (
              <div key={label}>
                <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{label}</h2>
                <div className="space-y-2">
                  {items.map((tema) => (
                    <div
                      key={tema.id}
                      className={`flex items-start gap-3 bg-white/[0.03] border rounded-xl p-4 transition ${
                        tema.activo ? "border-white/5" : "border-white/[0.03] opacity-60"
                      }`}
                    >
                      {isSuperadmin && <GripVertical size={16} className="text-white/20 mt-0.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{tema.tema}</p>
                        {tema.angulo && (
                          <p className="text-sm text-white/40 mt-0.5 leading-relaxed">{tema.angulo}</p>
                        )}
                      </div>
                      {isSuperadmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggle(tema.id)}
                            className="p-1.5 rounded-lg hover:bg-white/5 transition text-white/40 hover:text-white/70"
                            title={tema.activo ? "Desactivar" : "Activar"}
                          >
                            {tema.activo ? <ToggleRight size={18} className="text-green-400" /> : <ToggleLeft size={18} />}
                          </button>
                          <button
                            onClick={() => handleDelete(tema.id)}
                            className="p-1.5 rounded-lg hover:bg-red-400/10 transition text-white/30 hover:text-red-400"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}

          {temas.length === 0 && (
            <p className="text-sm text-white/25 text-center py-12">No hay temas aún</p>
          )}
        </div>
      )}

      {showForm && (
        <Modal title="Nuevo tema" onClose={() => setShowForm(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Tema *</label>
              <input
                required
                value={formTema}
                onChange={(e) => setFormTema(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FE5915]/50 transition placeholder-white/20"
                placeholder="Título del tema de contenido"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Ángulo / descripción</label>
              <textarea
                rows={3}
                value={formAngulo}
                onChange={(e) => setFormAngulo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FE5915]/50 transition placeholder-white/20"
                placeholder="Describe el ángulo o enfoque del tema..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-[#FE5915] hover:bg-[#e84d0e] disabled:opacity-50 text-black text-sm font-semibold rounded-lg transition">
                {saving ? "Guardando..." : "Crear tema"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
