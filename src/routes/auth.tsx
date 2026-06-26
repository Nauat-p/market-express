import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Mail, Lock, Loader2, ShoppingBasket } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { redirect: r } = search;
      throw (await import("@tanstack/react-router")).redirect({
        to: r && r.startsWith("/") ? (r as "/") : "/home",
      });
    }
  },
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já pode começar a comprar.");
        navigate({ to: "/home" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/home" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Algo deu errado";
      const friendly = msg.includes("Invalid login")
        ? "Email ou senha incorretos"
        : msg.includes("already registered")
        ? "Este email já está cadastrado"
        : msg.includes("Password should")
        ? "A senha precisa ter ao menos 6 caracteres"
        : msg;
      toast.error(friendly);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Não foi possível entrar com Google.");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/home" });
    } catch {
      toast.error("Não foi possível entrar com Google.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="size-14 rounded-2xl bg-primary text-primary-foreground grid place-items-center mb-4 shadow-card">
              <ShoppingBasket className="size-7" strokeWidth={2} />
            </div>
            <h1 className="font-serif italic text-3xl text-foreground text-center leading-tight">
              Mercadinho<br />Tauan Pires
            </h1>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Sobral · Entrega rápida no seu bairro
            </p>
          </div>

          <div className="bg-card ring-1 ring-border rounded-3xl p-6 shadow-card">
            <div className="flex gap-1 p-1 bg-muted rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  mode === "signin"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  mode === "signup"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Criar conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como devemos te chamar?"
                    className="w-full bg-muted/60 ring-1 ring-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="w-full bg-muted/60 ring-1 ring-border rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-muted/60 ring-1 ring-border rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[.98] transition-transform disabled:opacity-60"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {mode === "signin" ? "Entrar" : "Criar conta"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              ou
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full bg-card ring-1 ring-border rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-3 active:scale-[.98] transition-transform disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <svg className="size-4" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4.1 5.3l6.2 5.2C41.3 35.5 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z" />
                </svg>
              )}
              Continuar com Google
            </button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed">
            Ao continuar você concorda com os termos do app.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
