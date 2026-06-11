import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { supabase } from "@/lib/supabase";
import { EtapaTimer } from "@/components/EtapaTimer";
import hsfLogo from "@/assets/hsf-logo.png";

export const Route = createFileRoute("/crm")({
  component: CrmPage,
  head: () => ({ meta: [{ title: "CRM — HS Factor" }] }),
});

export type EtapaKey =
  | "a_discovery"
  | "discovery_agendada"
  | "en_diagnostico"
  | "presentacion_agendada"
  | "en_cierre"
  | "ganado"
  | "descartado";

export const ETAPAS: { key: EtapaKey; label: string; color: string }[] = [
  { key: "a_discovery", label: "A Discovery", color: "#FFD4B8" },
  { key: "discovery_agendada", label: "Discovery Agendada", color: "#FFB088" },
  { key: "en_diagnostico", label: "En Diagnóstico", color: "#FF8C55" },
  { key: "presentacion_agendada", label: "Presentación Agendada", color: "#FE7233" },
  { key: "en_cierre", label: "En Cierre", color: "#FE5915" },
  { key: "ganado", label: "Ganado", color: "#CC4000" },
  { key: "descartado", label: "Descartado", color: "#888780" },
];

export const TAMANO_OPCIONES = ["1 a 5", "6 a 15", "16 a 80", "81 a 250", "Más de 250"];
export const FUENTE_SUGERENCIAS = [
  "Summit",
  "Gira TX",
  "Personal",
  "Clase",
  "Referido Daniel",
  "Referido Growth",
  "Otro",
];

export type Oportunidad = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
  tamano: string | null;
  ubicacion: string | null;
  fuente: string | null;
  etapa: EtapaKey;
  vendedor_id: string | null;
  producto_recomendado: string | null;
  observaciones: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  etapa_changed_at: string | null;
  eliminado: boolean | null;
};

type UserRow = { user_id: string; email: string | null; role: string };

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function CrmPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [filterVendedor, setFilterVendedor] = useState("");
  const [filterFuente, setFilterFuente] = useState("");
  const [filtroTamano, setFiltroTamano] = useState<string>("todos");
  const [showNew, setShowNew] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const load = async () => {
    // Leer tokens de la URL y restaurar sesión si existen
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      // Limpiar tokens de la URL sin recargar
      window.history.replaceState({}, "", window.location.pathname);
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      navigate({ to: "/" });
      return;
    }
    setEmail(session.user.email ?? "");
    setMyUid(session.user.id);
    const [{ data: opps }, { data: us }] = await Promise.all([
      supabase.from("crm_oportunidades").select("*").eq("eliminado", false).order("updated_at", { ascending: false }),
      supabase.rpc("get_users_with_roles"),
    ]);
    setOportunidades((opps as Oportunidad[]) ?? []);
    setUsers(
      ((us as UserRow[]) ?? []).filter(
        (u) => u.role === "vendedor" || u.role === "coordinador" || u.role === "superadmin",
      ),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const userMap = useMemo(() => {
    const m = new Map<string, string>();
    users.forEach((u) => m.set(u.user_id, u.email ?? u.user_id));
    return m;
  }, [users]);

  const fuentes = useMemo(() => {
    const set = new Set<string>();
    oportunidades.forEach((o) => {
      if (o.fuente) set.add(o.fuente);
    });
    return Array.from(set).sort();
  }, [oportunidades]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return oportunidades.filter((o) => {
      if (s && !(o.nombre?.toLowerCase().includes(s) || o.empresa?.toLowerCase().includes(s))) return false;
      if (filterVendedor === "__mine__") {
        if (o.vendedor_id !== myUid) return false;
      } else if (filterVendedor) {
        if (o.vendedor_id !== filterVendedor) return false;
      }
      if (filterFuente && o.fuente !== filterFuente) return false;
      if (filtroTamano !== "todos" && o.tamano !== filtroTamano) return false;
      return true;
    });
  }, [oportunidades, search, filterVendedor, filterFuente, myUid, filtroTamano]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const handleDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id));

  const handleDragEnd = async (e: DragEndEvent) => {
    setDraggingId(null);
    const id = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const target = ETAPAS.find((x) => x.key === overId);
    if (!target) return;
    const opp = oportunidades.find((o) => o.id === id);
    if (!opp || opp.etapa === target.key) return;
    const previous = opp.etapa;
    const now = new Date().toISOString();
    setOportunidades((prev) =>
      prev.map((o) => (o.id === id ? { ...o, etapa: target.key, updated_at: now, etapa_changed_at: now } : o)),
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    const { error } = await supabase.from("crm_oportunidades").update({ etapa: target.key }).eq("id", id);
    if (error) {
      alert("Error: " + error.message);
      load();
      return;
    }
    await supabase.from("crm_actividad").insert({
      oportunidad_id: id,
      tipo: "etapa_cambio",
      etapa_anterior: previous,
      etapa_nueva: target.key,
      autor_id: uid,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-[#E2ECF4]/60">Cargando...</div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-[#E2ECF4]">
      <header
        className="sticky top-0 z-10 border-b backdrop-blur"
        style={{ backgroundColor: "rgba(8,12,16,0.85)", borderColor: "rgba(226,236,244,0.08)" }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={hsfLogo} alt="HS Factor" className="h-8" />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-[#E2ECF4]/70">{email}</span>
            <Link
              to="/dashboard"
              className="text-sm px-3 py-1.5 rounded-md border border-white/15 hover:border-[#FE5915] hover:text-[#FE5915] transition"
            >
              ← Dashboard
            </Link>
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

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">CRM Comercial</h2>
          <button
            onClick={() => setShowNew(true)}
            className="text-sm px-4 py-2 rounded-md font-medium text-white"
            style={{ backgroundColor: "#FE5915" }}
          >
            + Nueva oportunidad
          </button>
        </div>

        <div
          className="flex flex-wrap items-end gap-3 mb-6 p-4 rounded-xl border"
          style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs uppercase tracking-wider text-[#E2ECF4]/60 mb-1">Buscar</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre o empresa..."
              className="w-full rounded-md px-3 py-2 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915]"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs uppercase tracking-wider text-[#E2ECF4]/60 mb-1">Vendedor</label>
            <select
              value={filterVendedor}
              onChange={(e) => setFilterVendedor(e.target.value)}
              className="w-full rounded-md px-3 py-2 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915]"
            >
              <option value="">Todos</option>
              <option value="__mine__">Mis oportunidades</option>
              {users
                .filter((u) => u.role !== "superadmin")
                .map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.email}
                  </option>
                ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs uppercase tracking-wider text-[#E2ECF4]/60 mb-1">Fuente</label>
            <select
              value={filterFuente}
              onChange={(e) => setFilterFuente(e.target.value)}
              className="w-full rounded-md px-3 py-2 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915]"
            >
              <option value="">Todas</option>
              {fuentes.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs uppercase tracking-wider text-[#E2ECF4]/60 mb-1">Tamaño</label>
            <select
              value={filtroTamano}
              onChange={(e) => setFiltroTamano(e.target.value)}
              className="w-full rounded-md px-3 py-2 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915]"
            >
              <option value="todos">Todos los tamaños</option>
              <option value="1 a 5">1 a 5</option>
              <option value="6 a 15">6 a 15</option>
              <option value="16 a 80">16 a 80</option>
              <option value="81 a 250">81 a 250</option>
              <option value="Más de 250">Más de 250</option>
            </select>
          </div>
          <button
            onClick={() => {
              setSearch("");
              setFilterVendedor("");
              setFilterFuente("");
            }}
            className="text-sm px-3 py-2 rounded-md border border-white/15 text-[#E2ECF4]/80 hover:border-white/30 transition"
          >
            Limpiar filtros
          </button>
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} cancelDrop={() => false}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            {ETAPAS.map((et) => {
              const cards = filtered.filter((o) => o.etapa === et.key);
              return <Column key={et.key} etapa={et} cards={cards} userMap={userMap} />;
            })}
          </div>
          <DragOverlay>
            {draggingId ? (
              <Card opp={oportunidades.find((o) => o.id === draggingId)!} userMap={userMap} overlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {showNew && (
        <NewOpportunityModal
          users={users}
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function Column({
  etapa,
  cards,
  userMap,
}: {
  etapa: { key: EtapaKey; label: string; color: string };
  cards: Oportunidad[];
  userMap: Map<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.key });
  return (
    <div ref={setNodeRef} className="flex flex-col gap-2 min-w-0">
      <div
        className="rounded-lg px-3 py-2 text-xs font-semibold text-white flex items-center justify-between"
        style={{ backgroundColor: etapa.color }}
      >
        <span className="truncate">{etapa.label}</span>
        <span className="bg-black/25 rounded-full px-2 py-0.5 text-[10px]">{cards.length}</span>
      </div>
      <div
        className="flex flex-col gap-2 min-h-[120px] p-1.5 rounded-lg transition"
        style={{ backgroundColor: isOver ? "rgba(254,89,21,0.08)" : "transparent" }}
      >
        {cards.map((c) => (
          <Card key={c.id} opp={c} userMap={userMap} />
        ))}
      </div>
    </div>
  );
}

function Card({ opp, userMap, overlay }: { opp: Oportunidad; userMap: Map<string, string>; overlay?: boolean }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opp.id });
  const days = daysSince(opp.updated_at);
  const stale = days > 7;
  const style: React.CSSProperties = {
    backgroundColor: "#002138",
    borderColor: stale ? "#E24B4A" : "rgba(226,236,244,0.10)",
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging && !overlay ? 0.4 : 1,
    cursor: "pointer",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        if (overlay) return;
        if (isDragging) return;
        e.stopPropagation();
        navigate({ to: "/crm/$id", params: { id: opp.id } });
      }}
      className="rounded-lg border p-3 text-sm text-[#E2ECF4] hover:border-[#FE5915]/60 transition cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="font-semibold text-white truncate mr-2">{opp.nombre}</div>
          {opp.etapa_changed_at && <EtapaTimer etapa={opp.etapa} etapaChangedAt={opp.etapa_changed_at} />}
        </div>
        <div
          {...attributes}
          {...listeners}
          data-drag-handle="true"
          className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-[#E2ECF4]/40 hover:text-[#E2ECF4]/80 cursor-grab"
          title="Arrastrar"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="2" cy="2" r="1.2" />
            <circle cx="6" cy="2" r="1.2" />
            <circle cx="10" cy="2" r="1.2" />
            <circle cx="2" cy="6" r="1.2" />
            <circle cx="6" cy="6" r="1.2" />
            <circle cx="10" cy="6" r="1.2" />
            <circle cx="2" cy="10" r="1.2" />
            <circle cx="6" cy="10" r="1.2" />
            <circle cx="10" cy="10" r="1.2" />
          </svg>
        </div>
      </div>
      {opp.empresa && <div className="text-xs text-[#E2ECF4]/80 truncate">{opp.empresa}</div>}
      {opp.tamano && <div className="text-[11px] text-[#E2ECF4]/60">{opp.tamano}</div>}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {opp.fuente && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#E2ECF4]/80">
            {opp.fuente}
          </span>
        )}
        {opp.vendedor_id && userMap.get(opp.vendedor_id) && (
          <span className="text-[10px] text-[#E2ECF4]/60 truncate">· {userMap.get(opp.vendedor_id)}</span>
        )}
      </div>
      <div className="text-[10px] mt-2" style={{ color: stale ? "#fca5a5" : "rgba(226,236,244,0.5)" }}>
        {days === 0 ? "Actualizado hoy" : `${days}d sin actualizar`}
      </div>
    </div>
  );
}

function NewOpportunityModal({
  users,
  onClose,
  onCreated,
}: {
  users: UserRow[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    tamano: "",
    ubicacion: "",
    fuente: "",
    etapa: "a_discovery" as EtapaKey,
    vendedor_id: "",
    producto_recomendado: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user.id;
    const payload = {
      nombre: form.nombre.trim(),
      email: form.email || null,
      telefono: form.telefono || null,
      empresa: form.empresa || null,
      tamano: form.tamano || null,
      ubicacion: form.ubicacion || null,
      fuente: form.fuente || null,
      etapa: form.etapa,
      vendedor_id: form.vendedor_id || null,
      producto_recomendado: form.producto_recomendado || null,
      observaciones: form.observaciones || null,
      created_by: uid,
    };
    const { data, error: insErr } = await supabase.from("crm_oportunidades").insert(payload).select("id").single();
    if (insErr) {
      setError(insErr.message);
      setSaving(false);
      return;
    }
    await supabase.from("crm_actividad").insert({
      oportunidad_id: data.id,
      tipo: "nota",
      nota: "Oportunidad creada",
      autor_id: uid,
    });
    if (form.email) {
      try {
        const { data, error } = await supabase.rpc("upsert_persona_lead_magnet", {
          p_email: form.email.trim().toLowerCase(),
          p_nombre: form.nombre.trim(),
          p_telefono: form.telefono || null,
          p_ciudad: null,
          p_empresa: form.empresa || null,
          p_tamano: form.tamano || null,
        });
        if (error) {
          console.error("upsert_persona_lead_magnet falló:", error);
        } else {
          console.log("upsert_persona_lead_magnet exitoso:", data);
        }
      } catch (e) {
        console.error("upsert_persona_lead_magnet falló:", e);
      }

      try {
        await supabase.functions.invoke("sync-to-ac", {
          body: {
            source: "crm_oportunidad",
            email: form.email,
            nombre: form.nombre,
            oportunidad_id: data.id,
          },
        });
      } catch (e) {
        console.warn("sync-to-ac crm_oportunidad failed", e);
      }
    }

    setSaving(false);
    onCreated();
  };

  const inputCls =
    "w-full rounded-md px-3 py-2 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl my-8 rounded-2xl p-6 border"
        style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Nueva oportunidad</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre *">
            <input className={inputCls} value={form.nombre} onChange={(e) => update("nombre", e.target.value)} />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>
          <Field label="Teléfono">
            <input className={inputCls} value={form.telefono} onChange={(e) => update("telefono", e.target.value)} />
          </Field>
          <Field label="Empresa">
            <input className={inputCls} value={form.empresa} onChange={(e) => update("empresa", e.target.value)} />
          </Field>
          <Field label="Tamaño">
            <select className={inputCls} value={form.tamano} onChange={(e) => update("tamano", e.target.value)}>
              <option value="">—</option>
              {TAMANO_OPCIONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ubicación">
            <input className={inputCls} value={form.ubicacion} onChange={(e) => update("ubicacion", e.target.value)} />
          </Field>
          <Field label="Fuente">
            <input
              list="fuentes-list"
              className={inputCls}
              value={form.fuente}
              onChange={(e) => update("fuente", e.target.value)}
            />
            <datalist id="fuentes-list">
              {FUENTE_SUGERENCIAS.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </Field>
          <Field label="Etapa inicial">
            <select
              className={inputCls}
              value={form.etapa}
              onChange={(e) => update("etapa", e.target.value as EtapaKey)}
            >
              {ETAPAS.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vendedor asignado">
            <select
              className={inputCls}
              value={form.vendedor_id}
              onChange={(e) => update("vendedor_id", e.target.value)}
            >
              <option value="">Sin asignar</option>
              {users.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.email} ({u.role})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Producto recomendado">
            <input
              className={inputCls}
              value={form.producto_recomendado}
              onChange={(e) => update("producto_recomendado", e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Observaciones">
              <textarea
                rows={3}
                className={inputCls}
                value={form.observaciones}
                onChange={(e) => update("observaciones", e.target.value)}
              />
            </Field>
          </div>
        </div>
        {error && (
          <div className="mt-4 text-sm rounded-md px-3 py-2 bg-red-500/10 text-red-300 border border-red-500/30">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="text-sm px-3 py-2 rounded-md border border-white/15 text-[#E2ECF4]/80 hover:border-white/30"
          >
            Cancelar
          </button>
          <button
            disabled={saving}
            onClick={submit}
            className="text-sm px-4 py-2 rounded-md font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: "#FE5915" }}
          >
            {saving ? "Guardando..." : "Crear oportunidad"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs uppercase tracking-wider text-[#E2ECF4]/60">{label}</label>
      {children}
    </div>
  );
}
