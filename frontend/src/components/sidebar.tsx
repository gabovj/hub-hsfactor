"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  KanbanSquare,
  LogOut,
  Settings,
  Users,
} from "lucide-react"
import { useAuth } from "@/contexts/auth"

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  roles?: Array<"superadmin" | "coordinador" | "vendedor">
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <BarChart3 size={18} /> },
  { label: "CRM", href: "/crm", icon: <KanbanSquare size={18} /> },
  {
    label: "Contenidos",
    href: "/contenidos",
    icon: <BookOpen size={18} />,
    roles: ["superadmin", "coordinador"],
  },
  {
    label: "Usuarios",
    href: "/admin/usuarios",
    icon: <Users size={18} />,
    roles: ["superadmin"],
  },
  {
    label: "Configuración",
    href: "/admin/configuracion",
    icon: <Settings size={18} />,
    roles: ["superadmin"],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  async function handleLogout() {
    await logout()
    router.replace("/login")
  }

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-[#E2ECF4]/[0.08] bg-[#002138] min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#E2ECF4]/[0.08]">
        <Image
          src="/hsf-logo.png"
          alt="HS Factor"
          width={120}
          height={23}
          className="object-contain object-left"
          priority
        />
        <p className="text-[10px] text-[#E2ECF4]/40 mt-1 font-medium tracking-wide">Hub interno</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#FE5915]/15 text-[#FE5915]"
                  : "text-[#E2ECF4]/50 hover:text-[#E2ECF4]/80 hover:bg-white/5"
              }`}
            >
              <span className={isActive ? "text-[#FE5915]" : "text-[#E2ECF4]/30"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-[#E2ECF4]/[0.08]">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-[#E2ECF4]/80 truncate">{user?.email}</p>
          <p className="text-[10px] text-[#E2ECF4]/30 capitalize mt-0.5">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-[#E2ECF4]/40 hover:text-red-400 hover:bg-red-400/5 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
