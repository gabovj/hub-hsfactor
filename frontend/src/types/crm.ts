export type Etapa =
  | "a_discovery"
  | "discovery_agendada"
  | "en_diagnostico"
  | "presentacion_agendada"
  | "en_cierre"
  | "ganado"
  | "descartado"

export type Oportunidad = {
  id: string
  nombre: string
  email?: string
  telefono?: string
  empresa?: string
  tamano?: string
  ubicacion?: string
  fuente?: string
  etapa: Etapa
  vendedor_id?: string
  producto_recomendado?: string
  observaciones?: string
  created_by?: string
  created_at: string
  updated_at: string
  etapa_changed_at?: string
  eliminado: boolean
}

export type Actividad = {
  id: string
  oportunidad_id: string
  autor_id?: string
  tipo: string
  nota?: string
  etapa_anterior?: string
  etapa_nueva?: string
  created_at: string
}

export type Archivo = {
  id: string
  oportunidad_id: string
  nombre: string
  descripcion?: string
  tipo: string
  storage_path: string
  subido_por?: string
  tamano_bytes?: number
  created_at: string
}

export const ETAPA_LABEL: Record<Etapa, string> = {
  a_discovery: "A Discovery",
  discovery_agendada: "Discovery Agendada",
  en_diagnostico: "En Diagnóstico",
  presentacion_agendada: "Presentación Agendada",
  en_cierre: "En Cierre",
  ganado: "Ganado",
  descartado: "Descartado",
}

export const ETAPAS: Etapa[] = [
  "a_discovery",
  "discovery_agendada",
  "en_diagnostico",
  "presentacion_agendada",
  "en_cierre",
  "ganado",
  "descartado",
]
