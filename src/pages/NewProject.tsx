import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen, Upload, Link2, FileText, Sparkles, ArrowLeft,
  X, Loader2, Check, RefreshCw, Globe,
} from "lucide-react";

type Material = {
  id: string;
  type: "file" | "text" | "url" | "prompt";
  name: string;
  content: string;
};

type AISuggestion = {
  title: string;
  subtitle: string;
  author_name: string;
  description: string;
  chapters: { title: string; points: string[] }[];
};

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [promptText, setPromptText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  // AI suggestion state
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedSubtitle, setEditedSubtitle] = useState("");
  const [editedAuthor, setEditedAuthor] = useState("");
  const [creating, setCreating] = useState(false);

  const addMaterial = (m: Omit<Material, "id">) => {
    setMaterials((prev) => [...prev, { ...m, id: crypto.randomUUID() }]);
  };

  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(async (file) => {
      const text = await file.text();
      addMaterial({
        type: "file",
        name: file.name,
        content: text.slice(0, 50000),
      });
    });
    e.target.value = "";
  }, []);

  const addPaste = () => {
    if (!pasteText.trim()) return;
    addMaterial({ type: "text", name: "Wklejony tekst", content: pasteText.trim() });
    setPasteText("");
    setShowPaste(false);
  };

  const addUrl = async () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    addMaterial({ type: "url", name: url, content: `[URL do pobrania] ${url}` });
    setUrlInput("");
    setShowUrl(false);
  };

  const allContent = () => {
    let parts: string[] = [];
    materials.forEach((m) => parts.push(`--- ${m.name} ---\n${m.content}`));
    if (promptText.trim()) parts.push(`--- Wytyczne użytkownika ---\n${promptText}`);
    return parts.join("\n\n");
  };

  const analyzeWithAI = async () => {
    if (materials.length === 0 && !promptText.trim()) {
      toast({ title: "Dodaj materiały", description: "Wrzuć pliki, wklej tekst lub wpisz prompt dla AI.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setSuggestion(null);
    try {
      // First import URLs if any
      const urlMaterials = materials.filter((m) => m.type === "url");
      for (const um of urlMaterials) {
        const urlStr = um.content.replace("[URL do pobrania] ", "");
        try {
          const { data } = await supabase.functions.invoke("generate-ebook", {
            body: { action: "import-url", url: urlStr },
          });
          if (data?.text) {
            um.content = data.text;
            um.name = `Treść z: ${urlStr}`;
          }
        } catch {
          // keep original
        }
      }
      setMaterials([...materials]);

      const { data, error } = await supabase.functions.invoke("generate-ebook", {
        body: { action: "analyze", materials: allContent() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuggestion(data);
      setEditedTitle(data.title || "");
      setEditedSubtitle(data.subtitle || "");
      setEditedAuthor(data.author_name || "");
    } catch (err: any) {
      toast({ title: "Błąd analizy", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const createProject = async () => {
    if (!user || !suggestion) return;
    setCreating(true);
    try {
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          title: editedTitle || suggestion.title,
          subtitle: editedSubtitle || suggestion.subtitle,
          author_name: editedAuthor,
          description: suggestion.description,
          user_id: user.id,
          language: "pl",
          page_size: "A4",
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Create chapters from AI suggestion
      for (let i = 0; i < suggestion.chapters.length; i++) {
        const ch = suggestion.chapters[i];
        const blocks: any[] = [
          { id: crypto.randomUUID(), type: "heading", content: ch.title, level: 1 },
        ];
        ch.points.forEach((p) => {
          blocks.push({ id: crypto.randomUUID(), type: "heading", content: p, level: 2 });
          blocks.push({ id: crypto.randomUUID(), type: "text", content: "" });
        });
        await supabase.from("chapters").insert({
          project_id: (project as any).id,
          title: ch.title,
          sort_order: i,
          blocks,
        } as any);
      }

      toast({ title: "Projekt utworzony!" });
      navigate(`/editor/${(project as any).id}`);
    } catch (err: any) {
      toast({ title: "Błąd", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const materialIcons: Record<string, any> = {
    file: FileText,
    text: FileText,
    url: Globe,
    prompt: Sparkles,
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto max-w-4xl flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground gap-2">
            <ArrowLeft className="h-4 w-4" /> Powrót
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Nowy e-book</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {!suggestion ? (
          <div className="space-y-8">
            {/* Step 1: Materials */}
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                Wrzuć materiały
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Dodaj pliki, wklej tekst, podaj linki — AI przeanalizuje wszystko i zaproponuje strukturę e-booka.
              </p>

              {/* Upload area */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-card/50">
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-foreground">Wgraj pliki</span>
                  <span className="text-xs text-muted-foreground">.txt, .pdf, .docx</span>
                  <input
                    type="file"
                    multiple
                    accept=".txt,.pdf,.docx,.md"
                    onChange={handleFiles}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setShowPaste(!showPaste)}
                  className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-card/50"
                >
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-foreground">Wklej tekst</span>
                  <span className="text-xs text-muted-foreground">kopiuj-wklej</span>
                </button>

                <button
                  onClick={() => setShowUrl(!showUrl)}
                  className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-card/50"
                >
                  <Link2 className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-foreground">Dodaj link</span>
                  <span className="text-xs text-muted-foreground">URL artykułu</span>
                </button>
              </div>

              {/* Paste area */}
              {showPaste && (
                <div className="bg-card rounded-xl border border-border/50 p-4 mb-4 space-y-3">
                  <Textarea
                    placeholder="Wklej tutaj swój tekst..."
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    className="bg-secondary border-border min-h-[120px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addPaste} className="bg-gradient-gold text-primary-foreground">
                      Dodaj tekst
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowPaste(false); setPasteText(""); }}>
                      Anuluj
                    </Button>
                  </div>
                </div>
              )}

              {/* URL input */}
              {showUrl && (
                <div className="bg-card rounded-xl border border-border/50 p-4 mb-4 space-y-3">
                  <Input
                    placeholder="https://example.com/artykul"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="bg-secondary border-border"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addUrl} className="bg-gradient-gold text-primary-foreground">
                      Dodaj link
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowUrl(false); setUrlInput(""); }}>
                      Anuluj
                    </Button>
                  </div>
                </div>
              )}

              {/* Materials list */}
              {materials.length > 0 && (
                <div className="space-y-2 mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Dodane materiały ({materials.length})</h3>
                  {materials.map((m) => {
                    const Icon = materialIcons[m.type] || FileText;
                    return (
                      <div key={m.id} className="flex items-center gap-3 bg-card rounded-lg border border-border/50 px-4 py-3">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground truncate flex-1">{m.name}</span>
                        <span className="text-xs text-muted-foreground">{Math.round(m.content.length / 1000)}k znaków</span>
                        <button onClick={() => removeMaterial(m.id)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Optional prompt */}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                Wytyczne dla AI <span className="text-muted-foreground font-normal text-sm">(opcjonalnie)</span>
              </h2>
              <Textarea
                placeholder='Np. "Stwórz profesjonalny e-book o songwritingu w heavy metalu, uwzględnij riffy, strukturę utworów i teorię muzyki" lub "Na podstawie tych materiałów stwórz poradnik o marketingu"'
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="bg-card border-border min-h-[100px]"
              />
            </div>

            {/* Generate button */}
            <Button
              onClick={analyzeWithAI}
              disabled={analyzing || (materials.length === 0 && !promptText.trim())}
              className="w-full h-14 text-lg bg-gradient-gold text-primary-foreground hover:opacity-90 gap-3"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AI analizuje materiały...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generuj e-book z AI
                </>
              )}
            </Button>
          </div>
        ) : (
          /* AI Suggestion Review */
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Check className="h-5 w-5 text-green-500" />
                <h2 className="font-display text-2xl font-bold text-foreground">AI zaproponowało strukturę</h2>
              </div>
              <p className="text-muted-foreground text-sm mb-6">
                Edytuj tytuł i podtytuł jeśli chcesz, lub zostaw propozycje AI. Następnie zatwierdź.
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Tytuł e-booka</label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="bg-secondary border-border text-lg font-display"
                  placeholder="Tytuł..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Podtytuł</label>
                <Input
                  value={editedSubtitle}
                  onChange={(e) => setEditedSubtitle(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="Podtytuł (opcjonalnie)..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Autor</label>
                <Input
                  value={editedAuthor}
                  onChange={(e) => setEditedAuthor(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="Twoje imię i nazwisko..."
                />
              </div>
              {suggestion.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Opis</label>
                  <p className="text-sm text-secondary-foreground bg-secondary rounded-lg p-3">{suggestion.description}</p>
                </div>
              )}
            </div>

            {/* Chapters preview */}
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-3">
                Struktura ({suggestion.chapters.length} rozdziałów)
              </h3>
              <div className="space-y-2">
                {suggestion.chapters.map((ch, i) => (
                  <div key={i} className="bg-card rounded-lg border border-border/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-primary bg-primary/10 rounded px-2 py-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{ch.title}</span>
                    </div>
                    {ch.points.length > 0 && (
                      <div className="mt-2 ml-8 space-y-1">
                        {ch.points.map((p, j) => (
                          <p key={j} className="text-xs text-muted-foreground">• {p}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setSuggestion(null); }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Wróć i zmień materiały
              </Button>
              <Button
                variant="outline"
                onClick={analyzeWithAI}
                disabled={analyzing}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {analyzing ? "Generuję..." : "Generuj ponownie"}
              </Button>
              <Button
                onClick={createProject}
                disabled={creating}
                className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2"
              >
                {creating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Tworzę projekt...</>
                ) : (
                  <><Check className="h-4 w-4" /> Utwórz e-book</>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
