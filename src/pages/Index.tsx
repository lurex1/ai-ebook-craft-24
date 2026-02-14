import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus, LogOut, Trash2, Copy, Calendar, Edit3, Loader2 } from "lucide-react";
import type { ProjectData } from "@/lib/blocks";
import { PAGE_SIZES } from "@/lib/templates";

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    author_name: "",
    description: "",
    language: "pl",
    page_size: "A4",
  });

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
    setProjects((data as any as ProjectData[]) || []);
    setLoading(false);
  };

  const createProject = async () => {
    if (!user) return;
    const { data: project, error } = await supabase
      .from("projects")
      .insert({ ...form, user_id: user.id } as any)
      .select()
      .single();
    if (error) {
      toast({ title: "Błąd", description: error.message, variant: "destructive" });
      return;
    }
    // Create first chapter
    await supabase.from("chapters").insert({
      project_id: (project as any).id,
      title: "Rozdział 1",
      sort_order: 0,
      blocks: [
        { id: crypto.randomUUID(), type: "heading", content: form.title || "Tytuł", level: 1 },
        { id: crypto.randomUUID(), type: "text", content: "Zacznij pisać tutaj..." },
      ],
    } as any);
    setCreateOpen(false);
    setForm({ title: "", subtitle: "", author_name: "", description: "", language: "pl", page_size: "A4" });
    navigate(`/editor/${(project as any).id}`);
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Czy na pewno chcesz usunąć ten projekt?")) return;
    await supabase.from("projects").delete().eq("id", id);
    setProjects(projects.filter((p) => p.id !== id));
  };

  const duplicateProject = async (project: ProjectData, e: React.MouseEvent) => {
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
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground gap-2">
              <LogOut className="h-4 w-4" /> Wyloguj
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Twoje projekty</h2>
            <p className="text-muted-foreground text-sm">{projects.length} e-booków</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2">
                <Plus className="h-4 w-4" /> Nowy projekt
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-foreground">Nowy e-book</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Tytuł e-booka"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-secondary border-border"
                />
                <Input
                  placeholder="Podtytuł (opcjonalnie)"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="bg-secondary border-border"
                />
                <Input
                  placeholder="Autor"
                  value={form.author_name}
                  onChange={(e) => setForm({ ...form, author_name: e.target.value })}
                  className="bg-secondary border-border"
                />
                <Textarea
                  placeholder="Opis (opcjonalnie)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-secondary border-border"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pl">Polski</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.page_size} onValueChange={(v) => setForm({ ...form, page_size: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAGE_SIZES).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createProject} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                  Utwórz e-book
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-9 w-9 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Brak projektów</h3>
            <p className="text-muted-foreground mb-6">Utwórz swój pierwszy e-book</p>
            <Button onClick={() => setCreateOpen(true)} className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2">
              <Plus className="h-4 w-4" /> Nowy projekt
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
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
          <div>
            <p>Scripto by Paveelo · Paweł Eberle — firma nierejestrowana</p>
            <p>ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola, Polska</p>
          </div>
          <div className="flex gap-4">
            <a href="/terms" className="hover:text-primary transition-colors">Regulamin</a>
            <a href="/privacy" className="hover:text-primary transition-colors">Polityka prywatności</a>
            <a href="/cookies" className="hover:text-primary transition-colors">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
