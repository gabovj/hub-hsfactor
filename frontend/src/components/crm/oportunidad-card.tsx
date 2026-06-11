"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { useRouter } from "next/navigation"
import { Building2, Mail, Phone } from "lucide-react"
import type { Oportunidad } from "@/types/crm"

type Props = {
  oportunidad: Oportunidad
}

export default function OportunidadCard({ oportunidad: op }: Props) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: op.id,
    data: { etapa: op.etapa },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 rounded-lg p-3 cursor-grab active:cursor-grabbing group"
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-sm font-medium leading-snug hover:text-[#FE5915] cursor-pointer transition"
          onClick={(e) => { e.stopPropagation(); router.push(`/crm/${op.id}`) }}
        >
          {op.nombre}
        </p>
      </div>

      {op.empresa && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-white/40">
          <Building2 size={11} />
          <span className="truncate">{op.empresa}</span>
        </div>
      )}
      {op.email && (
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-white/30">
          <Mail size={11} />
          <span className="truncate">{op.email}</span>
        </div>
      )}
      {op.telefono && (
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-white/30">
          <Phone size={11} />
          <span>{op.telefono}</span>
        </div>
      )}
    </div>
  )
}
