"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/contexts/auth"
import { ETAPA_LABEL, type Oportunidad } from "@/types/crm"

export default function DashboardPage() {
  const { user } = useAuth()
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Oportunidad[]>("/crm/oportunidades").then(({ data }) => {
      setOportunidades(data)
    }).finally(() => setLoading(false))
  }, [])

  const activas = oportunidades.filter((o) => !["ganado", "descartado"].includes(o.etapa))
  const enCierre = oportunidades.filter((o) => o.etapa === "en_cierre")
  const ganadas = oportunidades.filter((o) => o.etapa === "ganado")

  const recientes = [...oportunidades]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Bienvenido, {user?.email}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-[#FE5915]/30 border-t-[#FE5915] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Oportunidades activas", value: activas.length },
              { label: "En cierre", value: enCierre.length },
              { label: "Ganadas", value: ganadas.length },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
                <p className="text-xs text-white/40 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Actividad reciente</h2>
              <Link href="/crm" className="flex items-center gap-1 text-xs text-[#FE5915]/70 hover:text-[#FE5915] transition">
                Ver todas <ArrowRight size={12} />
              </Link>
            </div>
            {recientes.length === 0 ? (
              <p className="text-sm text-white/25 text-center py-6">No hay oportunidades aún</p>
            ) : (
              <div className="space-y-2">
                {recientes.map((op) => (
                  <Link
                    key={op.id}
                    href={`/crm/${op.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition"
                  >
                    <div>
                      <p className="text-sm font-medium">{op.nombre}</p>
                      {op.empresa && <p className="text-xs text-white/40">{op.empresa}</p>}
                    </div>
                    <span className="text-xs text-white/30 shrink-0 ml-4">
                      {ETAPA_LABEL[op.etapa]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
