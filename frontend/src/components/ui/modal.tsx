"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

type Props = {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[#0D1117] border border-white/10 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
