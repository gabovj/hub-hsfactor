import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase, type AppRole } from "@/lib/supabase";
import hsfLogo from "@/assets/hsf-logo.png";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  head: () => ({ meta: [{ title: "Dashboard — HS Factor" }] }),
});

type Tool = { name: string; status: "active" | "soon"; href?: string };
type Column = { title: string; color: string; tools: Tool[] };

const COLUMNS: Column[] = [
  {
    title: "Atracción",
    color: "#378ADD",
    tools: [
      { name: "Generador de contenidos", status: "active", href: "/generador_contenidos" },
      { name: "Generador de Lead Magnets", status: "soon" },
      { name: "Editor de Buyer Personas", status: "soon" },
      { name: "Creador de campañas", status: "soon" },
      { name: "Optimizador de campañas", status: "soon" },
      { name: "Lead Magnets", status: "active" },
    ],
  },
  {
    title: "Discovery Call",
    color: "#1D9E75",
    tools: [
      { name: "Guía para Discovery Calls", status: "active", href: "https://discovery.e5metrics.com/" },
    ],
  },
  {
    title: "Diagnóstico",
    color: "#7F77DD",
    tools: [
      { name: "Generador de Diagnósticos", status: "active", href: "https://scalingup.e5metrics.com/admin" },
    ],
  },
  {
    title: "Presentación",
    color: "#BA7517",
    tools: [
      { name: "Generador de presentaciones", status: "soon" },
      { name: "Generador de Propuestas", status: "soon" },
      { name: "Presentación de Diagnósticos", status: "soon" },
    ],
  },
  {
    title: "CRM",
    color: "#3B6D11",
    tools: [{ name: "Visualizador de CRM", status: "active" as const, href: "/crm" }],
  },
];

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<AppRole | null>(null);
  const [leadMagnetsOpen, setLeadMagnetsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/" });
        return;
      }
      const user = session.user;
      if (cancelled) return;
      setEmail(user.email ?? "");
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (cancelled) return;
      setRole((roleRow?.role as AppRole) ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [navigate]);

  const handleAppClick = useCallback(async (url: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const target = url.startsWith("/") ? "_self" : "_blank";
    if (session) {
      const params = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      window.open(`${url}?${params.toString()}`, target);
    } else {
      window.open(url, target);
    }
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-[#E2ECF4]/60">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-[#E2ECF4]">
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{
          backgroundColor: "rgba(8,12,16,0.85)",
          borderColor: "rgba(226,236,244,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img src={hsfLogo} alt="HS Factor" className="h-8" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-[#E2ECF4]/70">{email}</span>
            {role === "superadmin" && (
              <Link
                to="/admin"
                className="text-sm px-3 py-1.5 rounded-md border border-white/15 hover:border-[#FE5915] hover:text-[#FE5915] transition"
              >
                Admin
              </Link>
            )}
            <button
              onClick={signOut}
              className="text-sm px-3 py-1.5 rounded-md font-medium text-white"
              style={{ backgroundColor: "#FE5915" }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-white">Proceso Comercial</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {COLUMNS.map((col) => (
            <section key={col.title} className="flex flex-col gap-3">
              <div
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white text-center"
                style={{ backgroundColor: col.color }}
              >
                {col.title}
              </div>
              <div className="flex flex-col gap-3">
                {col.tools.map((t) => {
                  if (t.name === "Lead Magnets") {
                    return (
                      <div key={t.name} className="flex flex-col gap-2">
                        <button
                          onClick={() => setLeadMagnetsOpen((v) => !v)}
                          className="rounded-xl p-4 text-white font-medium text-sm transition hover:translate-y-[-2px] hover:shadow-lg text-left"
                          style={{ backgroundColor: "#FE5915" }}
                        >
                          {t.name}
                        </button>
                        {leadMagnetsOpen && (
                          <>
                            <a
                              href="https://impactx.e5metrics.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl p-4 text-sm border transition hover:border-[#FE5915]"
                              style={{
                                backgroundColor: "#002138",
                                borderColor: "rgba(226,236,244,0.08)",
                              }}
                            >
                              <div className="font-medium text-white">Descubre la etapa de crecimiento de tu empresa</div>
                              <div className="mt-1 text-sm" style={{ color: "rgba(226,236,244,0.7)" }}>
                                Responde un assessment breve y descubre qué ajustar en tu liderazgo, equipo y empresa para escalar con claridad.
                              </div>
                              <div className="mt-2 text-xs font-medium" style={{ color: "#FE5915" }}>
                                impactx.e5metrics.com
                              </div>
                            </a>
                            <a
                              href="https://emprendedor.e5metrics.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-xl p-4 text-sm border transition hover:border-[#FE5915]"
                              style={{
                                backgroundColor: "#002138",
                                borderColor: "rgba(226,236,244,0.08)",
                              }}
                            >
                              <div className="font-medium text-white">El freno de tu empresa podrías ser tú</div>
                              <div className="mt-1 text-sm" style={{ color: "rgba(226,236,244,0.7)" }}>
                                Descubre qué tipo de emprendedor eres y obtén el tip estratégico que necesitas para escalar sin límites, con más orden y menos drama.
                              </div>
                              <div className="mt-2 text-xs font-medium" style={{ color: "#FE5915" }}>
                                emprendedor.e5metrics.com
                              </div>
                            </a>
                          </>
                        )}
                      </div>
                    );
                  }
                  if (t.status === "active" && t.href) {
                    return (
                      <button
                        key={t.name}
                        onClick={() => handleAppClick(t.href!)}
                        className="rounded-xl p-4 text-white font-medium text-sm transition hover:translate-y-[-2px] hover:shadow-lg text-left"
                        style={{ backgroundColor: "#FE5915" }}
                      >
                        {t.name}
                      </button>
                    );
                  }
                  return (
                    <div
                      key={t.name}
                      className="rounded-xl p-4 text-sm border cursor-not-allowed"
                      style={{
                        backgroundColor: "#002138",
                        color: "rgba(226,236,244,0.55)",
                        borderColor: "rgba(226,236,244,0.08)",
                      }}
                    >
                      <div className="font-medium">{t.name}</div>
                      <span className="inline-block mt-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                        Próximamente
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}