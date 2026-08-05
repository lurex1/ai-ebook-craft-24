import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, LogOut, Trash2, Copy, Calendar, Edit3, Loader2, Crown, MousePointerClick, Wand2, SplitSquareHorizontal, Palette, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) loadProjects();
  }, [user]);

  const loadProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t("dash.confirmDelete"))) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects(projects.filter((p: any) => p.id !== id));
  };

  const duplicateProject = async (project: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const { data: newProject } = await supabase
      .from("projects")
      .insert({
        ...project,
        id: undefined,
        title: project.title + " " + t("dash.copy"),
        created_at: undefined,
        updated_at: undefined,
      } as any)
      .select()
      .single();
    if (newProject) {
      const { data: chapters } = await supabase
        .from("chapters")
        .select("*")
        .eq("project_id", project.id);
      if (chapters) {
        for (const ch of chapters) {
          await supabase.from("chapters").insert({
            project_id: (newProject as any).id,
            title: (ch as any).title,
            sort_order: (ch as any).sort_order,
            blocks: (ch as any).blocks,
          } as any);
        }
      }
      loadProjects();
      toast({ title: t("dash.duplicated") });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Scripto</h1>
              <p className="text-xs text-muted-foreground">by Paveelo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="text-muted-foreground gap-2">
              <SettingsIcon className="h-4 w-4" /> Ustawienia
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")} className="text-muted-foreground gap-2">
              <Crown className="h-4 w-4" /> {t("dash.pricing")}
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground gap-2">
              <LogOut className="h-4 w-4" /> {t("dash.logout")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="relative mb-10 rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(ellipse at 20% 0%, black, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at 20% 0%, black, transparent 75%)",
            }}
          />
          <div className="relative px-6 sm:px-10 py-10 sm:py-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                AI Ebook Studio
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground mb-3 max-w-2xl">
              {t("dash.createPro")}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mb-6">
              {t("dash.heroDesc")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => navigate("/new")} className="gap-2">
                <Plus className="h-4 w-4" /> {t("dash.createNew")}
              </Button>
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                <span>PDF / EPUB</span>
                <span className="opacity-40">•</span>
                <span>A4 · A5 · custom</span>
                <span className="opacity-40">•</span>
                <span>AI layout engine</span>
              </div>
            </div>
          </div>
        </section>

        {/* "Select & edit" feature section */}
        <div className="mb-10 bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MousePointerClick className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">{t("dash.selectEdit")}</h3>
              <p className="text-xs text-muted-foreground">{t("dash.selectEditDesc")}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
            {t("dash.selectEditLong")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-background rounded-lg p-3 border border-border/30">
              <Wand2 className="h-4 w-4 text-purple-400 mb-2" />
              <p className="text-xs font-medium text-foreground">{t("dash.aiTransforms")}</p>
              <p className="text-[10px] text-muted-foreground">{t("dash.aiTransformsDesc")}</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border/30">
              <SplitSquareHorizontal className="h-4 w-4 text-teal-400 mb-2" />
              <p className="text-xs font-medium text-foreground">{t("dash.extractBlock")}</p>
              <p className="text-[10px] text-muted-foreground">{t("dash.extractBlockDesc")}</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border/30">
              <Palette className="h-4 w-4 text-amber-400 mb-2" />
              <p className="text-xs font-medium text-foreground">{t("dash.colorsHighlight")}</p>
              <p className="text-[10px] text-muted-foreground">{t("dash.colorsHighlightDesc")}</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border/30">
              <Edit3 className="h-4 w-4 text-blue-400 mb-2" />
              <p className="text-xs font-medium text-foreground">{t("dash.generateGraphic")}</p>
              <p className="text-[10px] text-muted-foreground">{t("dash.generateGraphicDesc")}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">{t("dash.yourProjects")}</h2>
            <p className="text-muted-foreground text-sm">{projects.length} {t("dash.ebooks")}</p>
          </div>
          <Button
            onClick={() => navigate("/new")}
            className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2"
          >
            <Plus className="h-4 w-4" /> {t("dash.newProject")}
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-9 w-9 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">{t("dash.noProjects")}</h3>
            <p className="text-muted-foreground mb-6">{t("dash.createFirst")}</p>
            <Button
              onClick={() => navigate("/new")}
              className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2"
            >
              <Plus className="h-4 w-4" /> {t("dash.newProject")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p: any) => (
              <div
                key={p.id}
                onClick={() => navigate(`/editor/${p.id}`)}
                className="bg-card border border-border/50 rounded-xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-gold transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Edit3 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => duplicateProject(p, e)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={(e) => deleteProject(p.id, e)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-1">{p.title}</h3>
                {p.author_name && <p className="text-xs text-muted-foreground mb-2">{p.author_name}</p>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(p.updated_at).toLocaleDateString(lang === "en" ? "en" : "pl")}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border/30 px-6 py-6 mt-20">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between text-xs text-muted-foreground gap-4">
          <p>© {new Date().getFullYear()} Paveelo</p>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-primary transition-colors">{t("dash.terms")}</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">{t("dash.privacy")}</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">{t("dash.cookies")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
