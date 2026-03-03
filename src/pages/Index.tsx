import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, LogOut, Trash2, Copy, Calendar, Edit3, Loader2, Crown, MousePointerClick, Wand2, SplitSquareHorizontal, Palette } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-ebook.jpg";

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
    if (!confirm("Czy na pewno chcesz usunąć ten projekt?")) return;
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
        title: project.title + " (kopia)",
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
      toast({ title: "Zduplikowano projekt" });
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")} className="text-muted-foreground gap-2">
              <Crown className="h-4 w-4" /> Cennik
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground gap-2">
              <LogOut className="h-4 w-4" /> Wyloguj
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="relative rounded-2xl overflow-hidden mb-10">
          <img src={heroImage} alt="Scripto - twórz e-booki z AI" className="w-full h-48 sm:h-64 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent flex items-center">
            <div className="px-8 sm:px-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Twórz <span className="text-gradient-gold">profesjonalne</span> e-booki
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-4">
                Wgraj materiały, wybierz strukturę i pozwól AI wygenerować treść. Edytuj, formatuj i eksportuj w kilka minut.
              </p>
              <Button
                onClick={() => navigate("/new")}
                className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2"
              >
                <Plus className="h-4 w-4" /> Utwórz nowy e-book
              </Button>
            </div>
          </div>
        </div>

        {/* "Zaznacz i edytuj" feature section */}
        <div className="mb-10 bg-card border border-border/50 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MousePointerClick className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Zaznacz i edytuj</h3>
              <p className="text-xs text-muted-foreground">Intuicyjna edycja — wystarczy zaznaczyć tekst</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
            Zaznacz dowolny fragment tekstu w edytorze, a natychmiast pojawi się pływający toolbar z zestawem narzędzi. Bez menu, bez szukania opcji — wszystko pod kursorem.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-background rounded-lg p-3 border border-border/30">
              <Wand2 className="h-4 w-4 text-purple-400 mb-2" />
              <p className="text-xs font-medium text-foreground">AI transformacje</p>
              <p className="text-[10px] text-muted-foreground">Zamień w tabelę, listę, uprość lub rozwiń treść</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border/30">
              <SplitSquareHorizontal className="h-4 w-4 text-teal-400 mb-2" />
              <p className="text-xs font-medium text-foreground">Wyciągnij do bloku</p>
              <p className="text-[10px] text-muted-foreground">Utwórz osobny blok z zaznaczonego fragmentu</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border/30">
              <Palette className="h-4 w-4 text-amber-400 mb-2" />
              <p className="text-xs font-medium text-foreground">Kolory i podświetlenie</p>
              <p className="text-[10px] text-muted-foreground">Zmień kolor tekstu lub dodaj podświetlenie</p>
            </div>
            <div className="bg-background rounded-lg p-3 border border-border/30">
              <Edit3 className="h-4 w-4 text-blue-400 mb-2" />
              <p className="text-xs font-medium text-foreground">Generuj grafikę</p>
              <p className="text-[10px] text-muted-foreground">AI wygeneruje obraz na podstawie zaznaczenia</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Twoje projekty</h2>
            <p className="text-muted-foreground text-sm">{projects.length} e-booków</p>
          </div>
          <Button
            onClick={() => navigate("/new")}
            className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2"
          >
            <Plus className="h-4 w-4" /> Nowy projekt
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-9 w-9 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Brak projektów</h3>
            <p className="text-muted-foreground mb-6">Utwórz swój pierwszy e-book</p>
            <Button
              onClick={() => navigate("/new")}
              className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2"
            >
              <Plus className="h-4 w-4" /> Nowy projekt
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
                  {new Date(p.updated_at).toLocaleDateString("pl")}
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
            <Link to="/terms" className="hover:text-primary transition-colors">Regulamin</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Polityka prywatności</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
