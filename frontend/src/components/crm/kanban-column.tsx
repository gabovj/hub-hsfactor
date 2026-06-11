"use client"

import { useDroppable } from "@dnd-kit/core"
import OportunidadCard from "./oportunidad-card"
import type { Etapa, Oportunidad } from "@/types/crm"

const ETAPA_COLOR: Record<Etapa, string> = {
  a_discovery: "bg-slate-500/20 text-slate-300",
  discovery_agendada: "bg-blue-500/20 text-blue-300",
  en_diagnostico: "bg-violet-500/20 text-violet-300",
  presentacion_agendada: "bg-orange-500/20 text-orange-300",
  en_cierre: "bg-amber-500/20 text-amber-300",
  ganado: "bg-green-500/20 text-green-300",
  descartado: "bg-red-500/20 text-red-300",
}

type Props = {
  etapa: Etapa
  label: string
  oportunidades: Oportunidad[]
}

export default function KanbanColumn({ etapa, label, oportunidades }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa })

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ETAPA_COLOR[etapa]}`}>
          {label}
        </span>
        <span className="text-xs text-white/30">{oportunidades.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-24 rounded-lg p-1 transition-colors ${
          isOver ? "bg-[#FE5915]/5 ring-1 ring-[#FE5915]/20" : ""
        }`}
      >
        {oportunidades.map((op) => (
          <OportunidadCard key={op.id} oportunidad={op} />
        ))}
      </div>
    </div>
  )
}
