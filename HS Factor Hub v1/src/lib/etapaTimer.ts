export type EtapaKey =
  | 'a_discovery'
  | 'discovery_agendada'
  | 'en_diagnostico'
  | 'presentacion_agendada'
  | 'en_cierre'
  | 'ganado'
  | 'descartado'

const ETAPA_MAX_DIAS: Record<EtapaKey, number | null> = {
  a_discovery:           10,
  discovery_agendada:    10,
  en_diagnostico:        10,
  presentacion_agendada: 10,
  en_cierre:             20,
  ganado:                null,
  descartado:            null,
}

export function getTimerInfo(etapa: EtapaKey, etapaChangedAt: string) {
  const max = ETAPA_MAX_DIAS[etapa]
  if (max === null) return null

  const diasTranscurridos = Math.floor(
    (Date.now() - new Date(etapaChangedAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  const diasRestantes = Math.max(max - diasTranscurridos, 0)
  const out = diasTranscurridos >= max

  return {
    diasRestantes,
    max,
    out,
    ratio: diasRestantes / max,
  }
}

function interpolateHex(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16)
  const g1 = parseInt(c1.slice(3, 5), 16)
  const b1 = parseInt(c1.slice(5, 7), 16)
  const r2 = parseInt(c2.slice(1, 3), 16)
  const g2 = parseInt(c2.slice(3, 5), 16)
  const b2 = parseInt(c2.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

export function getTimerColor(ratio: number): string {
  const clamp = Math.max(0, Math.min(1, ratio))

  if (clamp >= 0.5) {
    const t = (1 - clamp) * 2
    return interpolateHex('#378ADD', '#FE5915', t)
  } else {
    const t = (0.5 - clamp) * 2
    return interpolateHex('#FE5915', '#E24B4A', t)
  }
}
