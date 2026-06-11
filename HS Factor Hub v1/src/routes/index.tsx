import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import hsfLogo from "@/assets/hsf-logo.png";

export const Route = createFileRoute("/")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "HS Factor — Hub Central" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={hsfLogo} alt="HS Factor" className="h-16 mx-auto" />
          <p className="mt-1 text-sm text-muted-foreground">Hub Central</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="rounded-2xl p-6 sm:p-8 space-y-5 border"
          style={{ backgroundColor: "#002138", borderColor: "rgba(226,236,244,0.08)" }}
        >
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 bg-[#080C10] text-white border border-white/10 outline-none focus:border-[#FE5915] transition"
              placeholder="••••••••"
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
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <div className="text-center">
            <Link
              to="/reset-password"
              className="text-sm text-[#E2ECF4]/70 hover:text-[#FE5915] transition"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
