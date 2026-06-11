"use client"

import { useCallback, useEffect, useState } from "react"
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Plus } from "lucide-react"
import api from "@/lib/api"
import { ETAPAS, ETAPA_LABEL, type Etapa, type Oportunidad } from "@/types/crm"
import KanbanColumn from "@/components/crm/kanban-column"
import OportunidadForm from "@/components/crm/oportunidad-form"
import Modal from "@/components/ui/modal"

export default function CrmPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const fetchOportunidades = useCallback(async () => {
    try {
      const { data } = await api.get<Oportunidad[]>("/crm/oportunidades")
      setOportunidades(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOportunidades() }, [fetchOportunidades])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.data.current?.etapa === over.id) return

    const opId = active.id as string
    const nuevaEtapa = over.id as Etapa

    // Optimistic update
    setOportunidades((prev) =>
      prev.map((op) => op.id === opId ? { ...op, etapa: nuevaEtapa } : op)
    )

    try {
      await api.patch(`/crm/oportunidades/${opId}/etapa`, { etapa: nuevaEtapa })
    } catch {
      fetchOportunidades() // revert on error
    }
  }

  function handleSave(op: Oportunidad) {
    setOportunidades((prev) => {
      const exists = prev.find((o) => o.id === op.id)
      return exists ? prev.map((o) => o.id === op.id ? op : o) : [op, ...prev]
    })
    setShowForm(false)
  }

  const byEtapa = (etapa: Etapa) => oportunidades.filter((o) => o.etapa === etapa)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-white/40 text-sm mt-0.5">{oportunidades.length} oportunidades activas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#FE5915] hover:bg-[#e84d0e] text-black text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          <Plus size={16} />
          Nueva oportunidad
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-5 h-5 border-2 border-[#FE5915]/30 border-t-[#FE5915] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-5 min-w-max">
              {ETAPAS.map((etapa) => (
                <KanbanColumn
                  key={etapa}
                  etapa={etapa}
                  label={ETAPA_LABEL[etapa]}
                  oportunidades={byEtapa(etapa)}
                />
              ))}
            </div>
          </DndContext>
        </div>
      )}

      {showForm && (
        <Modal title="Nueva oportunidad" onClose={() => setShowForm(false)}>
          <OportunidadForm onSave={handleSave} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
