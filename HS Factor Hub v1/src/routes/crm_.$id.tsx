import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type AppRole } from "@/lib/supabase";
import hsfLogo from "@/assets/hsf-logo.png";
import { ETAPAS, TAMANO_OPCIONES, FUENTE_SUGERENCIAS, type EtapaKey, type Oportunidad } from "./crm";

export const Route = createFileRoute("/crm_/$id")({
  component: CrmDetailPage,
  head: () => ({ meta: [{ title: "Expediente — HS Factor" }] }),
});

type UserRow = { user_id: string; email: string | null; role: AppRole | string };

function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

type Actividad = {
  id: string;
  oportunidad_id: string;
  tipo: string;
  nota: string | null;
  etapa_anterior: string | null;
  etapa_nueva: string | null;
  autor_id: string | null;
  created_at: string;
};

function CrmDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [myRole, setMyRole] = useState<string | null>(null);
  const [opp, setOpp] = useState<Oportunidad | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [discovery, setDiscovery] = useState<Record<string, unknown> | null>(null);
  const [submission, setSubmission] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [noteType, setNoteType] = useState<"nota" | "llamada" | "email">("nota");
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [archivos, setArchivos] = useState<any[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [modalArchivo, setModalArchivo] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [archivoForm, setArchivoForm] = useState({
    tipo: "otro",
    descripcion: "",
    archivo: null as File | null,
  });

  const userMap = useMemo(() => {
    const m = new Map<string, string>();
    users.forEach((u) => m.set(u.user_id, u.email ?? u.user_id));
    return m;
  }, [users]);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      return
    }
    setEmail(session.user.email ?? "")
    setCurrentUserId(session.user.id)
    const { data: oppData, error: oppErr } = await supabase
      .from("crm_oportunidades")
      .select("*")
      .eq("id", id)
      .single()

    if (oppErr || !oppData) {
      setLoading(false)
      return
    }
    setOpp(oppData as Oportunidad)

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single()
    setMyRole(roleRow?.role ?? null)

    const [{ data: us }, { data: acts }] = await Promise.all([
      supabase.rpc("get_users_with_roles"),
      supabase.from("crm_actividad").select("*").eq("oportunidad_id", id).order("created_at", { ascending: false }),
    ])
    setUsers(((us as UserRow[]) ?? []).filter(
      (u) => u.role === "vendedor" || u.role === "coordinador" || u.role === "superadmin"
    ))
    setActividades((acts as Actividad[]) ?? [])

    if ((oppData as Oportunidad).email) {
      const oppEmail = (oppData as Oportunidad).email!
      try {
        const { data: dc } = await supabase
          .from("discovery_calls")
          .select("*")
          .eq("prospecto_email", oppEmail)
          .limit(1)
          .maybeSingle()
        setDiscovery((dc as Record<string, unknown>) ?? null)
      } catch (e) {
        console.error("discovery_calls fetch failed:", e)
        setDiscovery(null)
      }

      try {
        const { data: sub, error: subErr } = await supabase
          .from("submissions")
          .select("*")
          .eq("email", oppEmail)
          .limit(1)
          .maybeSingle()
        if (subErr) {
          console.error("submissions fetch failed:", subErr)
          setSubmission(null)
        } else {
          setSubmission((sub as Record<string, unknown>) ?? null)
        }
      } catch (e) {
        console.error("submissions fetch threw:", e)
        setSubmission(null)
      }

      const { data: empId } = await supabase
        .rpc("get_empresa_id_por_email", { p_email: oppEmail })
      if (empId) {
        setEmpresaId(empId as string)
        const { data: archivosData } = await supabase
          .from("archivos_clientes")
          .select("*")
          .eq("empresa_id", empId)
          .order("created_at", { ascending: false })
        setArchivos(archivosData || [])
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  const canChangeVendedor = myRole === "superadmin" || myRole === "coordinador";
  const canDelete = myRole === "superadmin" || myRole === "coordinador";

  const confirmDelete = async () => {
    if (!opp) return;
    const razon = deleteReason.trim();
    if (!razon) return;
    setDeleting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user.id;
    const { error } = await supabase
      .from("crm_oportunidades")
      .update({
        eliminado: true,
        eliminado_razon: razon,
        eliminado_at: new Date().toISOString(),
        eliminado_por: uid,
      })
      .eq("id", opp.id);
    if (error) { alert("Error: " + error.message); setDeleting(false); return; }
    await supabase.from("crm_actividad").insert({
      oportunidad_id: opp.id,
      tipo: "nota",
      nota: "Contacto eliminado. Razón: " + razon,
      autor_id: uid,
    });
    setDeleting(false);
    setDeleteOpen(false);
    navigate({ to: "/crm" });
  };

  const updateField = <K extends keyof Oportunidad>(k: K, v: Oportunidad[K]) => {
    setOpp((prev) => prev ? { ...prev, [k]: v } : prev);
  };

  const saveChanges = async () => {
    if (!opp) return;
    setSaving(true);
    setSavedMsg(null);
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user.id;

    const { data: originalArr } = await supabase.from("crm_oportunidades").select("etapa").eq("id", opp.id).single();
    const previousEtapa = (originalArr as { etapa: EtapaKey } | null)?.etapa;

    const { error } = await supabase.from("crm_oportunidades").update({
      nombre: opp.nombre,
      email: opp.email,
      telefono: opp.telefono,
      empresa: opp.empresa,
      tamano: opp.tamano,
      ubicacion: opp.ubicacion,
      fuente: opp.fuente,
      etapa: opp.etapa,
      vendedor_id: opp.vendedor_id,
      producto_recomendado: opp.producto_recomendado,
      observaciones: opp.observaciones,
    }).eq("id", opp.id);
    if (error) { alert("Error: " + error.message); setSaving(false); return; }

    if (previousEtapa && previousEtapa !== opp.etapa) {
      await supabase.from("crm_actividad").insert({
        oportunidad_id: opp.id,
        tipo: "etapa_cambio",
        etapa_anterior: previousEtapa,
        etapa_nueva: opp.etapa,
        autor_id: uid,
      });
    }
    setSaving(false);
    setSavedMsg("Cambios guardados");
    setTimeout(() => setSavedMsg(null), 2000);
    await load();
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("crm_actividad").insert({
      oportunidad_id: id,
      tipo: noteType,
      nota: noteText.trim(),
      autor_id: session?.user.id,
    });
    setAddingNote(false);
    if (error) { alert("Error: " + error.message); return; }
    setNoteText("");
    await load();
  };

  const subirArchivo = async () => {
    if (!archivoForm.archivo || !opp) return;
    setSubiendoArchivo(true);
    try {
      const { data: empIdRaw, error: rpcError } = await supabase.rpc("get_empresa_id_por_email", {
        p_email: opp.email,
      });
      if (rpcError) console.error("get_empresa_id_por_email error:", rpcError);
      const empId: string | null =
        typeof empIdRaw === "string"
          ? empIdRaw
          : Array.isArray(empIdRaw)
            ? (empIdRaw[0]?.empresa_id ?? empIdRaw[0]?.get_empresa_id_por_email ?? empIdRaw[0] ?? null)
            : empIdRaw && typeof empIdRaw === "object"
              ? ((empIdRaw as Record<string, unknown>).empresa_id as string ?? null)
              : null;
      if (!empId) {
        alert("No se encontró la empresa asociada a este prospecto. Intenta de nuevo en unos segundos.");
        setSubiendoArchivo(false);
        return;
      }
      const path = `${empId}/${Date.now()}_${sanitizeFileName(archivoForm.archivo.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("archivos-clientes")
        .upload(path, archivoForm.archivo);
      if (uploadError) throw uploadError;
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("archivos_clientes").insert({
        empresa_id: empId,
        oportunidad_id: opp.id,
        nombre: archivoForm.archivo.name,
        descripcion: archivoForm.descripcion || null,
        tipo: archivoForm.tipo,
        contexto: "comercial",
        storage_path: path,
        subido_por: user?.id,
        tamano_bytes: archivoForm.archivo.size,
      });
      const { data } = await supabase
        .from("archivos_clientes")
        .select("*")
        .eq("empresa_id", empId)
        .order("created_at", { ascending: false });
      setArchivos(data || []);
      setModalArchivo(false);
      setArchivoForm({ tipo: "otro", descripcion: "", archivo: null });
    } catch (err) {
      console.error("Error al subir archivo:", err);
      alert("Error al subir archivo");
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const verArchivo = async (storagePath: string) => {
    const { data } = await supabase.storage
      .from("archivos-clientes")
      .createSignedUrl(storagePath, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const eliminarArchivo = async (archivo: any) => {
    if (!confirm(`¿Eliminar "${archivo.nombre}"?`)) return;
    await supabase.storage.from("archivos-clientes").remove([archivo.storage_path]);
    await supabase.from("archivos_clientes").delete().eq("id", archivo.id);
    setArchivos((prev) => prev.filter((a) => a.id !== archivo.id));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-[#E2ECF4]/60">Cargando...</div>;
  }

  if (!loading && !opp) {
    return (
      <div style={{ color: '#E2ECF4', padding: '2rem', background: '#080C10', minHeight: '100vh' }}>
        <p>Sin sesión o sin datos. Revisa la consola.</p>
        <a href="/crm" style={{ color: '#FE5915' }}>← Volver al CRM</a>
      </div>
    )
  }

  if (!opp) return null;

  const inputCls = "w-full rounded-md px-3 py-2 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915]";

  return (
    <div className="min-h-screen bg-background text-[#E2ECF4]">
      <header className="sticky top-0 z-10 border-b backdrop-blur" style={{ backgroundColor: "rgba(8,12,16,0.85)", borderColor: "rgba(226,236,244,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <img src={hsfLogo} alt="HS Factor" className="h-8" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-[#E2ECF4]/70">{email}</span>
            <Link to="/crm" className="text-sm px-3 py-1.5 rounded-md border border-white/15 hover:border-[#FE5915] hover:text-[#FE5915] transition">← CRM</Link>
            <button onClick={signOut} className="text-sm px-3 py-1.5 rounded-md font-medium text-white" style={{ backgroundColor: "#FE5915" }}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">{opp.nombre}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border p-5" style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#E2ECF4]/70 mb-4">Datos del prospecto</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DField label="Nombre"><input className={inputCls} value={opp.nombre ?? ""} onChange={(e) => updateField("nombre", e.target.value)} /></DField>
                <DField label="Email"><input className={inputCls} value={opp.email ?? ""} onChange={(e) => updateField("email", e.target.value)} /></DField>
                <DField label="Teléfono"><input className={inputCls} value={opp.telefono ?? ""} onChange={(e) => updateField("telefono", e.target.value)} /></DField>
                <DField label="Empresa"><input className={inputCls} value={opp.empresa ?? ""} onChange={(e) => updateField("empresa", e.target.value)} /></DField>
                <DField label="Tamaño">
                  <select className={inputCls} value={opp.tamano ?? ""} onChange={(e) => updateField("tamano", e.target.value || null)}>
                    <option value="">—</option>
                    {TAMANO_OPCIONES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </DField>
                <DField label="Ubicación"><input className={inputCls} value={opp.ubicacion ?? ""} onChange={(e) => updateField("ubicacion", e.target.value)} /></DField>
                <DField label="Fuente">
                  <input list="fuentes-detail" className={inputCls} value={opp.fuente ?? ""} onChange={(e) => updateField("fuente", e.target.value)} />
                  <datalist id="fuentes-detail">{FUENTE_SUGERENCIAS.map((f) => <option key={f} value={f} />)}</datalist>
                </DField>
                <DField label="Etapa">
                  <select className={inputCls} value={opp.etapa} onChange={(e) => updateField("etapa", e.target.value as EtapaKey)}>
                    {ETAPAS.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
                  </select>
                </DField>
                <DField label="Vendedor asignado">
                  <select className={inputCls} value={opp.vendedor_id ?? ""} disabled={!canChangeVendedor} onChange={(e) => updateField("vendedor_id", e.target.value || null)}>
                    <option value="">Sin asignar</option>
                    {users.map((u) => <option key={u.user_id} value={u.user_id}>{u.email} ({u.role})</option>)}
                  </select>
                </DField>
                <DField label="Producto recomendado"><input className={inputCls} value={opp.producto_recomendado ?? ""} onChange={(e) => updateField("producto_recomendado", e.target.value)} /></DField>
                <div className="sm:col-span-2">
                  <DField label="Observaciones">
                    <textarea rows={4} className={inputCls} value={opp.observaciones ?? ""} onChange={(e) => updateField("observaciones", e.target.value)} />
                  </DField>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                {savedMsg && <span className="text-sm text-emerald-300">{savedMsg}</span>}
                <button disabled={saving} onClick={saveChanges} className="text-sm px-4 py-2 rounded-md font-medium text-white disabled:opacity-60" style={{ backgroundColor: "#FE5915" }}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
              {canDelete && (
                <div className="flex justify-start mt-3">
                  <button
                    onClick={() => { setDeleteReason(""); setDeleteOpen(true); }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: '1px solid #E24B4A',
                      color: '#E24B4A',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#E24B4A'
                      e.currentTarget.style.color = '#ffffff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#E24B4A'
                    }}
                  >
                    Eliminar contacto
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border p-5" style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#E2ECF4]/70 mb-4">Datos de sistemas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4" style={{ borderColor: "rgba(226,236,244,0.08)" }}>
                  <div className="text-xs uppercase tracking-wider text-[#1D9E75] font-semibold mb-2">Discovery Call</div>
                  {discovery ? (
                    <div className="text-sm space-y-1">
                      <div><span className="text-[#E2ECF4]/60">Fecha:</span> {fmtDate(discovery.created_at as string)}</div>
                      <div><span className="text-[#E2ECF4]/60">Califica:</span> {discovery.califica ? "Sí" : "No"}</div>
                      {discovery.facturacion != null && <div><span className="text-[#E2ECF4]/60">Facturación:</span> {String(discovery.facturacion)}</div>}
                      {discovery.producto_recomendado != null && <div><span className="text-[#E2ECF4]/60">Producto recomendado:</span> {String(discovery.producto_recomendado)}</div>}
                      {discovery.notas_coach != null && <div><span className="text-[#E2ECF4]/60">Notas:</span> {String(discovery.notas_coach)}</div>}
                    </div>
                  ) : (
                    <div className="text-sm text-[#E2ECF4]/50">Sin registros aún</div>
                  )}
                </div>
                <div className="rounded-lg border p-4" style={{ borderColor: "rgba(226,236,244,0.08)" }}>
                  <div className="text-xs uppercase tracking-wider text-[#7F77DD] font-semibold mb-2">Diagnóstico Scaling Up</div>
                  {submission ? (
                    <div className="text-sm space-y-1">
                      <div><span className="text-[#E2ECF4]/60">Fecha:</span> {fmtDate(submission.created_at as string)}</div>
                      {submission.empresa != null && <div><span className="text-[#E2ECF4]/60">Empresa:</span> {String(submission.empresa)}</div>}
                      {submission.link != null && (
                        <div>
                          <a href={String(submission.link)} target="_blank" rel="noreferrer" className="text-[#FE5915] underline">Ver diagnóstico</a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-[#E2ECF4]/50">Sin registros aún</div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border p-5" style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#E2ECF4]/70">Archivos adjuntos</h3>
                {opp?.email && (
                  <button
                    onClick={() => setModalArchivo(true)}
                    className="text-sm px-3 py-1.5 rounded-md font-medium text-white"
                    style={{ backgroundColor: "#FE5915" }}
                  >
                    Subir archivo
                  </button>
                )}
              </div>
              {!opp?.email ? (
                <div className="text-sm text-[#E2ECF4]/50">
                  Guarda un email en los datos del prospecto para habilitar archivos adjuntos
                </div>
              ) : archivos.length === 0 ? (
                <div className="text-sm text-[#E2ECF4]/50">Sin archivos adjuntos</div>
              ) : (
                <div className="space-y-2">
                  {archivos.map((a) => {
                    const canDeleteFile =
                      myRole === "superadmin" || myRole === "coordinador" || a.subido_por === currentUserId;
                    return (
                      <div
                        key={a.id}
                        className="rounded-lg border p-3 flex items-center gap-3"
                        style={{ borderColor: "rgba(226,236,244,0.08)", backgroundColor: "rgba(8,12,16,0.5)" }}
                      >
                        <div className="text-2xl shrink-0">{iconForTipo(a.tipo)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white truncate">{a.nombre}</span>
                            <span
                              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
                              style={{ backgroundColor: "#002138", color: "#fff", border: "1px solid rgba(226,236,244,0.15)" }}
                            >
                              {a.tipo}
                            </span>
                          </div>
                          {a.descripcion && (
                            <div className="text-xs text-[#E2ECF4]/60 mt-0.5 truncate">{a.descripcion}</div>
                          )}
                          <div className="text-[11px] text-[#E2ECF4]/50 mt-1">
                            {fmtShortDate(a.created_at)} · {fmtSize(a.tamano_bytes)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => verArchivo(a.storage_path)}
                            className="text-xs px-3 py-1.5 rounded-md font-medium"
                            style={{ background: "transparent", border: "1px solid rgba(226,236,244,0.3)", color: "#E2ECF4" }}
                          >
                            Ver
                          </button>
                          {canDeleteFile && (
                            <button
                              onClick={() => eliminarArchivo(a)}
                              title="Eliminar"
                              className="text-sm px-2 py-1.5 rounded-md"
                              style={{ background: "transparent", border: "1px solid rgba(226,75,74,0.5)", color: "#E24B4A" }}
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Right column - actividad */}
          <div className="space-y-6">
            <section className="rounded-2xl border p-5" style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#E2ECF4]/70 mb-4">Actividad</h3>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {actividades.length === 0 && <div className="text-sm text-[#E2ECF4]/50">Sin actividad aún</div>}
                {actividades.map((a) => (
                  <div key={a.id} className="rounded-lg border p-3 text-sm" style={{ borderColor: "rgba(226,236,244,0.08)", backgroundColor: "rgba(8,12,16,0.5)" }}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="uppercase tracking-wider font-semibold" style={{ color: typeColor(a.tipo) }}>{a.tipo}</span>
                      <span className="text-[#E2ECF4]/50">{fmtDate(a.created_at)}</span>
                    </div>
                    {a.tipo === "etapa_cambio" ? (
                      <div className="text-[#E2ECF4]/85">
                        {etapaLabel(a.etapa_anterior)} → <strong className="text-white">{etapaLabel(a.etapa_nueva)}</strong>
                      </div>
                    ) : (
                      <div className="text-[#E2ECF4]/85 whitespace-pre-wrap">{a.nota}</div>
                    )}
                    <div className="text-[10px] text-[#E2ECF4]/50 mt-1">{a.autor_id ? userMap.get(a.autor_id) ?? a.autor_id : "—"}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                <div className="flex gap-2">
                  <select value={noteType} onChange={(e) => setNoteType(e.target.value as typeof noteType)} className="rounded-md px-2 py-2 bg-[#080C10] text-white border border-white/10 outline-none text-sm">
                    <option value="nota">Nota</option>
                    <option value="llamada">Llamada</option>
                    <option value="email">Email</option>
                  </select>
                  <button disabled={addingNote || !noteText.trim()} onClick={addNote} className="text-sm px-4 py-2 rounded-md font-medium text-white disabled:opacity-60" style={{ backgroundColor: "#FE5915" }}>
                    {addingNote ? "..." : "Agregar"}
                  </button>
                </div>
                <textarea rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Escribe una nota..." className={inputCls} />
              </div>
            </section>
          </div>
        </div>
      </main>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={() => !deleting && setDeleteOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)", color: "#E2ECF4" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-2">Eliminar contacto</h3>
            <p className="text-sm text-[#E2ECF4]/70 mb-4">Esta acción ocultará el contacto del CRM. Podrás restaurarlo desde el panel de administración.</p>
            <label className="block text-xs uppercase tracking-wider text-[#E2ECF4]/60 mb-1">Explica brevemente por qué se está eliminando este contacto</label>
            <textarea
              rows={4}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="w-full rounded-md px-3 py-2 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#E24B4A]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="text-sm px-4 py-2 rounded-md font-medium disabled:opacity-60"
                style={{ background: "transparent", border: "1px solid rgba(226,236,244,0.3)", color: "#E2ECF4" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting || !deleteReason.trim()}
                className="text-sm px-4 py-2 rounded-md font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "#E24B4A" }}
              >
                {deleting ? "Eliminando..." : "Confirmar eliminación"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalArchivo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => !subiendoArchivo && setModalArchivo(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6"
            style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)", color: "#E2ECF4" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Subir archivo</h3>
            <div className="space-y-3">
              <DField label="Tipo">
                <select
                  className={inputCls}
                  value={archivoForm.tipo}
                  onChange={(e) => setArchivoForm((f) => ({ ...f, tipo: e.target.value }))}
                >
                  <option value="otro">Otro</option>
                  <option value="diagnostico">Diagnóstico</option>
                  <option value="propuesta">Propuesta</option>
                  <option value="contrato">Contrato</option>
                  <option value="presentacion">Presentación</option>
                  <option value="reporte">Reporte</option>
                </select>
              </DField>
              <DField label="Descripción">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Ej: Propuesta comercial v2 — 27 mayo"
                  value={archivoForm.descripcion}
                  onChange={(e) => setArchivoForm((f) => ({ ...f, descripcion: e.target.value }))}
                />
              </DField>
              <DField label="Archivo">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.docx,.doc,.pptx,.ppt"
                  onChange={(e) =>
                    setArchivoForm((f) => ({ ...f, archivo: e.target.files?.[0] ?? null }))
                  }
                  className="w-full text-sm text-[#E2ECF4]"
                />
                {archivoForm.archivo && (
                  <div className="text-xs text-[#E2ECF4]/60 mt-1">{archivoForm.archivo.name}</div>
                )}
              </DField>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setModalArchivo(false)}
                disabled={subiendoArchivo}
                className="text-sm px-4 py-2 rounded-md font-medium disabled:opacity-60"
                style={{ background: "transparent", border: "1px solid rgba(226,236,244,0.3)", color: "#E2ECF4" }}
              >
                Cancelar
              </button>
              <button
                onClick={subirArchivo}
                disabled={subiendoArchivo || !archivoForm.archivo}
                className="text-sm px-4 py-2 rounded-md font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: "#FE5915" }}
              >
                {subiendoArchivo ? "Subiendo..." : "Subir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs uppercase tracking-wider text-[#E2ECF4]/60">{label}</label>
      {children}
    </div>
  );
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function etapaLabel(key: string | null): string {
  if (!key) return "—";
  return ETAPAS.find((e) => e.key === key)?.label ?? key;
}

function typeColor(t: string): string {
  switch (t) {
    case "etapa_cambio": return "#7F77DD";
    case "llamada": return "#1D9E75";
    case "email": return "#378ADD";
    default: return "#FE5915";
  }
}

function iconForTipo(t: string): string {
  switch (t) {
    case "diagnostico": return "📄";
    case "propuesta": return "📊";
    case "contrato": return "📝";
    case "presentacion": return "📑";
    case "reporte": return "📈";
    default: return "📎";
  }
}

function fmtShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function fmtSize(bytes: number | null | undefined): string {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}