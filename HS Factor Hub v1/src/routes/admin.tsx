import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase, type AppRole } from "@/lib/supabase";
import hsfLogo from "@/assets/hsf-logo.png";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/" });
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();
    if (roleRow?.role !== "superadmin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — HS Factor" }] }),
});

type RoleRow = {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string | null;
  disabled?: boolean;
};

function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("vendedor");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const loadRows = async () => {
    const { data, error } = await supabase.rpc("get_users_with_roles");
    if (error) {
      console.error("get_users_with_roles error", error);
      setRows([]);
      return;
    }
    setRows((data as RoleRow[]) ?? []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadRows();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const changeRole = async (userId: string, role: AppRole) => {
    setRows((prev) => prev.map((r) => (r.user_id === userId ? { ...r, role } : r)));
    const { error } = await supabase.from("user_roles").update({ role }).eq("user_id", userId);
    if (error) {
      alert("Error: " + error.message);
      await loadRows();
    }
  };

  const toggleDisabled = async (row: RoleRow) => {
    const next = !row.disabled;
    const verb = next ? "inhabilitar" : "habilitar";
    if (!confirm(`¿Seguro que quieres ${verb} a ${row.email ?? row.user_id}?`)) return;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, disabled: next } : r)));
    const { error } = await supabase.rpc("set_user_disabled", {
      _target_user_id: row.user_id,
      _disabled: next,
    });
    if (error) {
      alert("Error: " + error.message);
      await loadRows();
    }
  };

  const resendInvite = async (row: RoleRow) => {
    const { error } = await supabase.functions.invoke("invite-user", {
      body: { email: row.email, role: row.role },
    });
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Invitación reenviada a " + row.email);
    }
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
        style={{ backgroundColor: "rgba(8,12,16,0.85)", borderColor: "rgba(226,236,244,0.08)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-sm text-[#E2ECF4]/80 hover:text-[#FE5915] transition"
            >
              ← Volver al Dashboard
            </Link>
          </div>
          <img src={hsfLogo} alt="HS Factor" className="h-8" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Administración de usuarios</h2>
          <button
            onClick={() => { setInviteMsg(null); setInviteError(null); setInviteEmail(""); setShowInvite(true); }}
            className="text-sm px-4 py-2 rounded-md font-medium text-white"
            style={{ backgroundColor: "#FE5915" }}
          >
            + Invitar usuario
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
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="text-left px-4 py-3">Fecha de registro</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#E2ECF4]/60">
                      Sin usuarios todavía.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-white/5">
                    <td className="px-4 py-3 text-[#E2ECF4]/90">
                      {r.email ?? (
                        <span className="font-mono text-xs text-[#E2ECF4]/60">
                          {r.user_id}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={r.role}
                        onChange={(e) => changeRole(r.user_id, e.target.value as AppRole)}
                        className="bg-[#080C10] text-white border border-white/10 rounded-md px-2 py-1.5 outline-none focus:border-[#FE5915]"
                      >
                        <option value="superadmin">Superadmin</option>
                        <option value="coordinador">Coordinador</option>
                        <option value="vendedor">Vendedor</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[#E2ECF4]/70">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: r.disabled ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.12)",
                          color: r.disabled ? "#fca5a5" : "#86efac",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: r.disabled ? "#f87171" : "#4ade80" }}
                        />
                        {r.disabled ? "Inhabilitado" : "Activo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => resendInvite(r)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #FE5915',
                            color: '#FE5915',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'background 0.15s, color 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#FE5915'
                            e.currentTarget.style.color = '#ffffff'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = '#FE5915'
                          }}
                        >
                          Reenviar invitación
                        </button>
                        <button
                          onClick={() => toggleDisabled(r)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(226,236,244,0.3)',
                            color: 'rgba(226,236,244,0.7)',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(226,36,244,0.1)'
                            e.currentTarget.style.borderColor = 'rgba(226,236,244,0.6)'
                            e.currentTarget.style.color = '#ffffff'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = 'rgba(226,236,244,0.3)'
                            e.currentTarget.style.color = 'rgba(226,236,244,0.7)'
                          }}
                        >
                          {r.disabled ? "Habilitar" : "Inhabilitar"}
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

      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowInvite(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 border"
            style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Invitar usuario</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915] transition"
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Rol</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as AppRole)}
                  className="w-full rounded-lg px-3 py-2.5 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915] transition"
                >
                  <option value="superadmin">Superadmin</option>
                  <option value="coordinador">Coordinador</option>
                  <option value="vendedor">Vendedor</option>
                </select>
              </div>
              {inviteMsg && (
                <div className="text-sm rounded-md px-3 py-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {inviteMsg}
                </div>
              )}
              {inviteError && (
                <div className="text-sm rounded-md px-3 py-2 bg-red-500/10 text-red-300 border border-red-500/30">
                  {inviteError}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowInvite(false)}
                  className="text-sm px-3 py-2 rounded-md border border-white/15 text-[#E2ECF4]/80 hover:border-white/30 transition"
                >
                  Cancelar
                </button>
                <button
                  disabled={inviteLoading || !inviteEmail}
                  onClick={async () => {
                    setInviteError(null);
                    setInviteMsg(null);
                    setInviteLoading(true);
                    const { error } = await supabase.functions.invoke("invite-user", {
                      body: { email: inviteEmail, role: inviteRole },
                    });
                    setInviteLoading(false);
                    if (error) {
                      setInviteError(error.message);
                      return;
                    }
                    setInviteMsg("Invitación enviada correctamente");
                    setTimeout(() => { setShowInvite(false); loadRows(); }, 1000);
                  }}
                  className="text-sm px-4 py-2 rounded-md font-medium text-white disabled:opacity-60"
                  style={{ backgroundColor: "#FE5915" }}
                >
                  {inviteLoading ? "Enviando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}