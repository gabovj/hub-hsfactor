import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import hsfLogo from "@/assets/hsf-logo.png";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({ meta: [{ title: "Restablecer contraseña — HS Factor" }] }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Detect recovery token in URL
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("type=recovery")) setRecoveryMode(true);

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const sendInstructions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) return setError(error.message);
    setMessage("Te enviamos las instrucciones a tu email. Revisá tu bandeja.");
  };

  const updatePassword = async (e: React.FormEvent) => {
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
          <h2 className="text-xl font-semibold text-white">
            {recoveryMode ? "Nueva contraseña" : "Restablecer contraseña"}
          </h2>

          {!recoveryMode ? (
            <form onSubmit={sendInstructions} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915] transition"
                  placeholder="tu@empresa.com"
                />
              </div>
              {error && (
                <div className="text-sm rounded-md px-3 py-2 bg-red-500/10 text-red-300 border border-red-500/30">
                  {error}
                </div>
              )}
              {message && (
                <div className="text-sm rounded-md px-3 py-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {message}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-2.5 font-semibold text-white transition disabled:opacity-60"
                style={{ backgroundColor: "#FE5915" }}
              >
                {loading ? "Enviando..." : "Enviar instrucciones"}
              </button>
            </form>
          ) : (
            <form onSubmit={updatePassword} className="space-y-5">
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
                {loading ? "Guardando..." : "Actualizar contraseña"}
              </button>
            </form>
          )}

          <div className="text-center">
            <Link to="/" className="text-sm text-[#E2ECF4]/70 hover:text-[#FE5915] transition">
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}