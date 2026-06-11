import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import hsfLogo from "@/assets/hsf-logo.png";

export const Route = createFileRoute("/set-password")({
  component: SetPasswordPage,
  head: () => ({ meta: [{ title: "Definir contraseña — HS Factor" }] }),
});

function SetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("type=recovery") || hash.includes("type=invite") || hash.includes("access_token")) {
      setReady(true);
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        setReady(true);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={hsfLogo} alt="HS Factor" className="h-16 mx-auto" />
          <p className="mt-1 text-sm text-muted-foreground">Hub Central</p>
        </div>
        <div
          className="rounded-2xl p-6 sm:p-8 space-y-5 border"
          style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}
        >
          <h2 className="text-xl font-semibold text-white">Definir contraseña</h2>
          {!ready ? (
            <p className="text-sm text-[#E2ECF4]/70">
              Validando enlace de invitación...
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Nueva contraseña</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915] transition"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Confirmar contraseña</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915] transition"
                />
              </div>
              {error && (
                <div className="text-sm rounded-md px-3 py-2 bg-red-500/10 text-red-300 border border-red-500/30">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-2.5 font-semibold text-white transition disabled:opacity-60"
                style={{ backgroundColor: "#FE5915" }}
              >
                {loading ? "Guardando..." : "Confirmar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}