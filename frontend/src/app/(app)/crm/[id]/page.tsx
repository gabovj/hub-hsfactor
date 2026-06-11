"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, MessageSquare, Pencil, Trash2 } from "lucide-react"
import api from "@/lib/api"
import { ETAPA_LABEL, type Actividad, type Archivo, type Etapa, type Oportunidad } from "@/types/crm"
import Modal from "@/components/ui/modal"
import OportunidadForm from "@/components/crm/oportunidad-form"

export default function ExpedientePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [op, setOp] = useState<Oportunidad | null>(null)
  const [actividad, setActividad] = useState<Actividad[]>([])
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [nota, setNota] = useState("")
  const [savingNota, setSavingNota] = useState(false)

  const fetchAll = useCallback(async () => {
    const [opRes, actRes, arcRes] = await Promise.all([
      api.get(`/crm/oportunidades/${id}`),
      api.get(`/crm/oportunidades/${id}/actividad`),
      api.get(`/crm/oportunidades/${id}/archivos`),
    ])
    setOp(opRes.data)
    setActividad(actRes.data)
    setArchivos(arcRes.data)
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleAddNota(e: React.FormEvent) {
    e.preventDefault()
    if (!nota.trim()) return
    setSavingNota(true)
    try {
      await api.post(`/crm/oportunidades/${id}/actividad`, { tipo: "nota", nota })
      setNota("")
      const { data } = await api.get(`/crm/oportunidades/${id}/actividad`)
      setActividad(data)
    } finally {
      setSavingNota(false)
    }
  }

  async function handleEliminar() {
    const razon = window.prompt("Razón para descartar esta oportunidad:")
    if (!razon) return
    await api.delete(`/crm/oportunidades/${id}`, { data: { razon } })
    router.replace("/crm")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-[#FE5915]/30 border-t-[#FE5915] rounded-full animate-spin" />
      </div>
    )
  }

  if (!op) return null

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition mb-3">
            <ArrowLeft size={14} /> Volver al CRM
          </button>
          <h1 className="text-2xl font-bold">{op.nombre}</h1>
          <div className="flex items-center gap-3 mt-1">
            {op.empresa && <span className="text-white/50 text-sm">{op.empresa}</span>}
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FE5915]/15 text-[#FE5915]">
              {ETAPA_LABEL[op.etapa as Etapa]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 border border-white/10 rounded-lg px-3 py-1.5 transition">
            <Pencil size={14} /> Editar
          </button>
          <button onClick={handleEliminar} className="flex items-center gap-1.5 text-sm text-red-400/70 hover:text-red-400 border border-red-400/20 rounded-lg px-3 py-1.5 transition">
            <Trash2 size={14} /> Descartar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Info */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Contacto</h3>
            <dl className="space-y-2">
              {[
                ["Email", op.email],
                ["Teléfono", op.telefono],
                ["Ubicación", op.ubicacion],
                ["Fuente", op.fuente],
                ["Tamaño", op.tamano],
                ["Producto", op.producto_recomendado],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-xs text-white/30">{label}</dt>
                  <dd className="text-sm text-white/80">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {op.observaciones && (
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Observaciones</h3>
              <p className="text-sm text-white/60 whitespace-pre-wrap">{op.observaciones}</p>
            </div>
          )}

          {archivos.length > 0 && (
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                <FileText size={12} className="inline mr-1.5" />Archivos
              </h3>
              <ul className="space-y-1.5">
                {archivos.map((a) => (
                  <li key={a.id} className="text-sm text-[#FE5915]/80 hover:text-[#FE5915] truncate cursor-pointer">
                    {a.nombre}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actividad */}
        <div className="col-span-2">
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
              <MessageSquare size={12} className="inline mr-1.5" />Actividad
            </h3>

            <form onSubmit={handleAddNota} className="flex gap-2 mb-5">
              <input
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Agrega una nota..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FE5915]/50 transition placeholder-white/20"
              />
              <button
                type="submit"
                disabled={savingNota || !nota.trim()}
                className="px-3 py-2 bg-[#FE5915]/10 hover:bg-[#FE5915]/20 disabled:opacity-40 text-[#FE5915] text-sm rounded-lg transition"
              >
                Agregar
              </button>
            </form>

            <div className="space-y-3">
              {actividad.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {a.tipo === "etapa_cambio" ? (
                      <p className="text-sm text-white/40">
                        Etapa cambiada de{" "}
                        <span className="text-white/60">{ETAPA_LABEL[a.etapa_anterior as Etapa] ?? a.etapa_anterior}</span>
                        {" "}→{" "}
                        <span className="text-[#FE5915]">{ETAPA_LABEL[a.etapa_nueva as Etapa] ?? a.etapa_nueva}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-white/70 whitespace-pre-wrap">{a.nota}</p>
                    )}
                    <p className="text-xs text-white/25 mt-0.5">
                      {new Date(a.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                </div>
              ))}
              {actividad.length === 0 && (
                <p className="text-sm text-white/25 text-center py-4">Sin actividad registrada</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <Modal title="Editar oportunidad" onClose={() => setShowEdit(false)}>
          <OportunidadForm
            initial={op}
            onSave={(updated) => { setOp(updated); setShowEdit(false) }}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>
      )}
    </div>
  )
}
