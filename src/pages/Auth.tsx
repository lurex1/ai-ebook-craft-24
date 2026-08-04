import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";
import { lovable } from "@/integrations/lovable/index";

type AuthMode = "login" | "register" | "forgot" | "reset";

export default function Auth() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isRecovery =
    searchParams.get("type") === "recovery" ||
    (typeof window !== "undefined" && window.location.hash.includes("type=recovery"));

  useEffect(() => {
    if (!authLoading && user && mode !== "reset" && !isRecovery) navigate("/");
  }, [user, authLoading, navigate, mode, isRecovery]);

  useEffect(() => {
    if (isRecovery) setMode("reset");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => subscription.unsubscribe();
  }, [isRecovery]);



  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate("/");
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else if (mode === "register") {
        if (password.length < 8) throw new Error(t("auth.passwordMinError"));
        if (password !== confirmPassword) throw new Error(t("auth.passwordMismatch"));
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: t("auth.checkEmail"), description: t("auth.verifyLink") });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?type=recovery`,
        });
        if (error) throw error;
        toast({ title: t("auth.checkEmail"), description: t("auth.resetLink") });
        setMode("login");
      } else if (mode === "reset") {
        if (password.length < 8) throw new Error(t("auth.passwordMinError"));
        if (password !== confirmPassword) throw new Error(t("auth.passwordMismatch"));
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error(t("auth.resetDesc"));
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast({ title: t("common.success"), description: t("auth.passwordChanged") });
        window.history.replaceState({}, "", "/auth");
        setPassword("");
        setConfirmPassword("");
        navigate("/");
      }

    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<AuthMode, string> = {
    login: t("auth.login"),
    register: t("auth.register"),
    forgot: t("auth.forgotPassword"),
    reset: t("auth.newPassword"),
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LanguageSwitcher />
          </div>
          <div className="h-14 w-14 rounded-xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Scripto</h1>
          <p className="text-muted-foreground mt-1">{t("auth.subtitle")}</p>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-6">
          {(mode === "login" || mode === "register") && (
            <div className="flex mb-6 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {t("auth.login")}
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === "register" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {t("auth.register")}
              </button>
            </div>
          )}

          {(mode === "login" || mode === "register") && (
            <div className="mb-6">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleGoogle}
                className="w-full gap-2"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.6c-.1 1.1-.9 2.8-2.5 3.9l3.8 3c2.3-2.1 3.6-5.2 3.6-8.8z" />
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-3c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.9-5l-3.9 3C3.2 21.3 7.3 24 12 24z" />
                  <path fill="#FBBC05" d="M5.1 14.3c-.3-.8-.4-1.5-.4-2.3s.2-1.6.4-2.3l-4-3C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l3.9-3z" />
                  <path fill="#EA4335" d="M12 4.7c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.7l3.9 3c1-2.9 3.7-5 6.9-5z" />
                </svg>
                Google
              </Button>
              <div className="flex items-center gap-3 mt-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">lub</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
          )}



          {(mode === "forgot" || mode === "reset") && (
            <div className="mb-6">
              <button
                onClick={() => setMode("login")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("auth.backToLogin")}
              </button>
              <h2 className="text-lg font-semibold text-foreground mt-3">{titles[mode]}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "forgot" ? t("auth.forgotDesc") : t("auth.resetDesc")}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== "reset" && (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                  autoComplete="email"
                />
              </div>
            )}

            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={mode === "reset" ? t("auth.newPasswordPlaceholder") : t("auth.password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
            )}

            {(mode === "register" || mode === "reset") && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={t("auth.confirmPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2"
            >
              {loading
                ? "..."
                : mode === "login"
                ? t("auth.loginBtn")
                : mode === "register"
                ? t("auth.registerBtn")
                : mode === "forgot"
                ? t("auth.sendLink")
                : t("auth.setNewPassword")}
              <ArrowRight className="h-4 w-4" />
            </Button>

            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("auth.forgotBtn")}
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} Paveelo
        </p>
      </div>
    </div>
  );
}
