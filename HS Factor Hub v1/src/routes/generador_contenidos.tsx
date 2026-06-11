import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import hsfLogo from "@/assets/hsf-logo.png";

export const Route = createFileRoute("/generador_contenidos")({
  component: GeneradorContenidosPage,
  head: () => ({ meta: [{ title: "Banco de Temas — HS Factor" }] }),
});

type Tema = {
  id: string;
  tema: string;
  angulo: string | null;
  activo: boolean;
  orden: number;
};

function GeneradorContenidosPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Tema[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tema | null>(null);
  const [formTema, setFormTema] = useState("");
  const [formAngulo, setFormAngulo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate({ to: "/" });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      setRole((data?.role as string) ?? null);
      setAuthLoading(false);
    };
    fetchRole();
  }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("temas_contenido")
      .select("*")
      .order("orden", { ascending: true });
    if (error) {
      console.error(error);
      setRows([]);
    } else {
      setRows((data as Tema[]) ?? []);
    }
  };

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, []);

  if (authLoading) return null;
  if (role !== "superadmin") return <Navigate to="/dashboard" />;

  const openCreate = () => {
    setEditing(null);
    setFormTema("");
    setFormAngulo("");
    setShowModal(true);
  };

  const openEdit = (r: Tema) => {
    setEditing(r);
    setFormTema(r.tema);
    setFormAngulo(r.angulo ?? "");
    setShowModal(true);
  };

  const save = async () => {
    if (!formTema.trim()) return;
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from("temas_contenido")
        .update({ tema: formTema.trim(), angulo: formAngulo.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", editing.id);
      if (error) alert("Error: " + error.message);
    } else {
      const maxOrden = rows.reduce((m, r) => Math.max(m, r.orden), 0);
      const { error } = await supabase
        .from("temas_contenido")
        .insert({
          tema: formTema.trim(),
          angulo: formAngulo.trim() || null,
          activo: false,
          orden: maxOrden + 1,
        });
      if (error) alert("Error: " + error.message);
    }
    setSaving(false);
    setShowModal(false);
    await load();
  };

  const remove = async (r: Tema) => {
    if (!confirm(`¿Eliminar el tema "${r.tema}"?`)) return;
    const { error } = await supabase.from("temas_contenido").delete().eq("id", r.id);
    if (error) alert("Error: " + error.message);
    await load();
  };

  const activar = async (r: Tema) => {
    // Desactivar todos los activos y activar solo este
    const { error: e1 } = await supabase
      .from("temas_contenido")
      .update({ activo: false })
      .eq("activo", true);
    if (e1) {
      alert("Error: " + e1.message);
      return;
    }
    const { error: e2 } = await supabase
      .from("temas_contenido")
      .update({ activo: true })
      .eq("id", r.id);
    if (e2) alert("Error: " + e2.message);
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-[#E2ECF4]/60" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-[#E2ECF4]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{ backgroundColor: "rgba(8,12,16,0.85)", borderColor: "rgba(226,236,244,0.08)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="text-sm text-[#E2ECF4]/80 hover:text-[#FE5915] transition">
            ← Volver al Dashboard
          </Link>
          <img src={hsfLogo} alt="HS Factor" className="h-8" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Banco de Temas</h2>
          <button
            onClick={openCreate}
            className="text-sm px-4 py-2 rounded-md font-medium text-white"
            style={{ backgroundColor: "#FE5915" }}
          >
            ＋ Agregar tema
          </button>
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-[#E2ECF4]/70 uppercase text-xs tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 w-20">Orden</th>
                  <th className="text-left px-4 py-3">Tema</th>
                  <th className="text-left px-4 py-3">Ángulo</th>
                  <th className="text-left px-4 py-3 w-24">Activo</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#E2ECF4]/60">
                      Sin temas todavía.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-white/5"
                    style={r.activo ? { backgroundColor: "#FE5915" } : undefined}
                  >
                    <td className="px-4 py-3" style={{ color: r.activo ? "#fff" : undefined }}>{r.orden}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: r.activo ? "#fff" : "#E2ECF4" }}>{r.tema}</td>
                    <td className="px-4 py-3" style={{ color: r.activo ? "rgba(255,255,255,0.9)" : "rgba(226,236,244,0.7)" }}>{r.angulo ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.activo ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-white/20 text-white">
                          ● Activo
                        </span>
                      ) : (
                        <span className="text-xs text-[#E2ECF4]/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {!r.activo && (
                          <button
                            onClick={() => activar(r)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              border: "1px solid #FE5915",
                              color: "#FE5915",
                              background: "transparent",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: 500,
                            }}
                          >
                            Activar
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(r)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: r.activo ? "1px solid rgba(255,255,255,0.6)" : "1px solid rgba(226,236,244,0.3)",
                            color: r.activo ? "#fff" : "rgba(226,236,244,0.85)",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => remove(r)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: r.activo ? "1px solid rgba(255,255,255,0.6)" : "1px solid rgba(248,113,113,0.5)",
                            color: r.activo ? "#fff" : "#fca5a5",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 border"
            style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              {editing ? "Editar tema" : "Agregar tema"}
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Tema</label>
                <input
                  type="text"
                  value={formTema}
                  onChange={(e) => setFormTema(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915] transition"
                  placeholder="Título del tema"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Ángulo</label>
                <input
                  type="text"
                  value={formAngulo}
                  onChange={(e) => setFormAngulo(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915] transition"
                  placeholder="Enfoque o ángulo del contenido"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="text-sm px-3 py-2 rounded-md border border-white/15 text-[#E2ECF4]/80 hover:border-white/30 transition"
                >
                  Cancelar
                </button>
                <button
                  disabled={saving || !formTema.trim()}
                  onClick={save}
                  className="text-sm px-4 py-2 rounded-md font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: "#FE5915" }}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}