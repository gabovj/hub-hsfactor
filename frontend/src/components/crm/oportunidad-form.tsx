"use client"

import { useState } from "react"
import api from "@/lib/api"
import { ETAPAS, ETAPA_LABEL, type Etapa, type Oportunidad } from "@/types/crm"

type Props = {
  initial?: Partial<Oportunidad>
  onSave: (op: Oportunidad) => void
  onCancel: () => void
}

export default function OportunidadForm({ initial, onSave, onCancel }: Props) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? "",
    email: initial?.email ?? "",
    telefono: initial?.telefono ?? "",
    empresa: initial?.empresa ?? "",
    tamano: initial?.tamano ?? "",
    ubicacion: initial?.ubicacion ?? "",
    fuente: initial?.fuente ?? "",
    etapa: (initial?.etapa ?? "a_discovery") as Etapa,
    producto_recomendado: initial?.producto_recomendado ?? "",
    observaciones: initial?.observaciones ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== "")
      )
      const { data } = isEdit
        ? await api.patch(`/crm/oportunidades/${initial!.id}`, payload)
        : await api.post("/crm/oportunidades", payload)
      onSave(data)
    } catch {
      setError("Error al guardar. Verifica los datos.")
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FE5915]/50 focus:ring-1 focus:ring-[#FE5915]/20 transition placeholder-white/20"
  const labelClass = "block text-xs font-medium text-white/50 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>Nombre *</label>
          <input required className={inputClass} value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Nombre del prospecto" />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" className={inputClass} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@empresa.com" />
        </div>
        <div>
          <label className={labelClass}>Teléfono</label>
          <input className={inputClass} value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+52 55 0000 0000" />
        </div>
        <div>
          <label className={labelClass}>Empresa</label>
          <input className={inputClass} value={form.empresa} onChange={(e) => set("empresa", e.target.value)} placeholder="Nombre de la empresa" />
        </div>
        <div>
          <label className={labelClass}>Tamaño empresa</label>
          <input className={inputClass} value={form.tamano} onChange={(e) => set("tamano", e.target.value)} placeholder="ej. 10-50 empleados" />
        </div>
        <div>
          <label className={labelClass}>Ubicación</label>
          <input className={inputClass} value={form.ubicacion} onChange={(e) => set("ubicacion", e.target.value)} placeholder="Ciudad, País" />
        </div>
        <div>
          <label className={labelClass}>Fuente</label>
          <input className={inputClass} value={form.fuente} onChange={(e) => set("fuente", e.target.value)} placeholder="Referido, LinkedIn, etc." />
        </div>
        {!isEdit && (
          <div className="col-span-2">
            <label className={labelClass}>Etapa inicial</label>
            <select className={inputClass} value={form.etapa} onChange={(e) => set("etapa", e.target.value)}>
              {ETAPAS.map((e) => (
                <option key={e} value={e}>{ETAPA_LABEL[e]}</option>
              ))}
            </select>
          </div>
        )}
        <div className="col-span-2">
          <label className={labelClass}>Producto recomendado</label>
          <input className={inputClass} value={form.producto_recomendado} onChange={(e) => set("producto_recomendado", e.target.value)} placeholder="Programa o servicio" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Observaciones</label>
          <textarea rows={2} className={inputClass} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} placeholder="Notas adicionales..." />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-white/50 hover:text-white/80 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-[#FE5915] hover:bg-[#e84d0e] disabled:opacity-50 text-black text-sm font-semibold rounded-lg transition">
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear oportunidad"}
        </button>
      </div>
    </form>
  )
}
