import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Mail, Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";

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
