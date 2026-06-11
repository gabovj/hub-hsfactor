import { getTimerInfo, getTimerColor, EtapaKey } from '@/lib/etapaTimer'

interface Props {
  etapa: EtapaKey
  etapaChangedAt: string
}

export function EtapaTimer({ etapa, etapaChangedAt }: Props) {
  const info = getTimerInfo(etapa, etapaChangedAt)
  if (!info) return null

  const color = info.out ? '#E24B4A' : getTimerColor(info.ratio)
  const label = info.out ? 'OUT' : `${info.diasRestantes}/${info.max}`

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '11px',
        fontWeight: 600,
        color: color,
        border: `1px solid ${color}`,
        borderRadius: '4px',
        padding: '1px 5px',
        lineHeight: 1.4,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
