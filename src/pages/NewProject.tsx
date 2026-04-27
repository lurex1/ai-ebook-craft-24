import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  BookOpen, Upload, Link2, FileText, Sparkles, ArrowLeft,
  X, Loader2, Check, RefreshCw, Globe, ChevronDown, ChevronRight,
  Pencil, Wand2, CheckCircle2, Circle,
} from "lucide-react";
import { invokeGenerateEbook } from "@/lib/aiInvoke";

type Material = {
  id: string;
  type: "file" | "text" | "url" | "prompt";
  name: string;
  content: string;
  sourceUrl?: string; // original URL for citations
};

type StructureConfig = {
  chapters: number;
  hasSubchapters: boolean;
  hasPoints: boolean;
  hasSubpoints: boolean;
};

type SubpointItem = { title: string };
type PointItem = { title: string; subpoints?: SubpointItem[] };
type SubchapterItem = { title: string; points?: PointItem[] };
type ChapterItem = { title: string; subchapters?: SubchapterItem[]; points?: PointItem[] };

type AISuggestion = {
  title: string;
  subtitle: string;
  author_name: string;
  description: string;
  chapters: ChapterItem[];
};

// Flat section for content generation
type FlatSection = {
  id: string;
  path: string;
  title: string;
  depth: number; // 0=chapter, 1=subchapter/point, 2=subpoint
  content: string;
  source: "ai" | "user" | "empty";
  generating: boolean;
};

export default function NewProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step tracking
  const [step, setStep] = useState<"materials" | "structure" | "review" | "content">("materials");

  // Materials
  const [materials, setMaterials] = useState<Material[]>([]);
  const [promptText, setPromptText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  // Structure config
  const [structureConfig, setStructureConfig] = useState<StructureConfig>({
    chapters: 6,
    hasSubchapters: false,
    hasPoints: true,
    hasSubpoints: false,
  });

  // AI suggestion & content
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedSubtitle, setEditedSubtitle] = useState("");
  const [editedAuthor, setEditedAuthor] = useState("");
  const [sections, setSections] = useState<FlatSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState({ current: 0, total: 0 });
  const [creating, setCreating] = useState(false);

  // Material helpers
  const addMaterial = (m: Omit<Material, "id">) => {
    setMaterials((prev) => [...prev, { ...m, id: crypto.randomUUID() }]);
  };
  const removeMaterial = (id: string) => setMaterials((prev) => prev.filter((m) => m.id !== id));

  const handleFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(async (file) => {
      const text = await file.text();
      addMaterial({ type: "file", name: file.name, content: text.slice(0, 50000) });
    });
    e.target.value = "";
  }, []);

  const addPaste = () => {
    if (!pasteText.trim()) return;
    addMaterial({ type: "text", name: "Wklejony tekst", content: pasteText.trim() });
    setPasteText("");
    setShowPaste(false);
  };

  const isYouTubeUrl = (url: string) => /(?:youtube\.com\/(?:watch|shorts|embed|v\/)|youtu\.be\/)/.test(url);

  const addUrl = async () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    
    if (isYouTubeUrl(url)) {
      // YouTube — fetch transcript immediately
      const tempId = crypto.randomUUID();
      addMaterial({ type: "url", name: `🔄 Pobieram transkrypt z YouTube...`, content: "" });
      setUrlInput("");
      setShowUrl(false);
      
      try {
        const { data, error } = await invokeGenerateEbook({ action: "import-youtube", url });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        
        setMaterials((prev) => {
          const idx = prev.findIndex((m) => m.name.includes("Pobieram transkrypt"));
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = { ...updated[idx], name: `🎬 ${data.title || "Film YouTube"}`, content: data.text, sourceUrl: url };
          return updated;
        });
        toast({ title: "YouTube", description: "Transkrypt pobrany pomyślnie!" });
      } catch (err: any) {
        setMaterials((prev) => prev.filter((m) => !m.name.includes("Pobieram transkrypt")));
        toast({ title: "Błąd YouTube", description: err.message || "Nie udało się pobrać transkryptu", variant: "destructive" });
      }
    } else {
      addMaterial({ type: "url", name: url, content: `[URL do pobrania] ${url}`, sourceUrl: url });
      setUrlInput("");
      setShowUrl(false);
    }
  };

  const allContent = () => {
    let parts: string[] = [];
    materials.forEach((m) => parts.push(`--- ${m.name} ---\n${m.content}`));
    if (promptText.trim()) parts.push(`--- Wytyczne użytkownika ---\n${promptText}`);
    return parts.join("\n\n");
  };

  const getSourceUrls = (): { url: string; title: string }[] => {
    return materials
      .filter((m) => m.sourceUrl)
      .map((m) => ({ url: m.sourceUrl!, title: m.name.replace(/^🎬 /, "").replace(/^🔄.*$/, "") }));
  };

  // Flatten suggestion into sections
  const flattenSuggestion = (sug: AISuggestion): FlatSection[] => {
    const flat: FlatSection[] = [];
    sug.chapters.forEach((ch, ci) => {
      const chId = `ch-${ci}`;
      flat.push({ id: chId, path: `Rozdział ${ci + 1}`, title: ch.title, depth: 0, content: "", source: "empty", generating: false });

      if (ch.subchapters) {
        ch.subchapters.forEach((sub, si) => {
          const subId = `${chId}-sub-${si}`;
          flat.push({ id: subId, path: `${ci + 1}.${si + 1}`, title: sub.title, depth: 1, content: "", source: "empty", generating: false });
          if (sub.points) {
            sub.points.forEach((pt, pi) => {
              const ptId = `${subId}-pt-${pi}`;
              flat.push({ id: ptId, path: `${ci + 1}.${si + 1}.${pi + 1}`, title: pt.title, depth: 2, content: "", source: "empty", generating: false });
              if (pt.subpoints) {
                pt.subpoints.forEach((sp, spi) => {
                  flat.push({ id: `${ptId}-sp-${spi}`, path: `${ci + 1}.${si + 1}.${pi + 1}.${spi + 1}`, title: sp.title, depth: 3, content: "", source: "empty", generating: false });
                });
              }
            });
          }
        });
      } else if (ch.points) {
        ch.points.forEach((pt, pi) => {
          const ptId = `${chId}-pt-${pi}`;
          flat.push({ id: ptId, path: `${ci + 1}.${pi + 1}`, title: pt.title, depth: 1, content: "", source: "empty", generating: false });
          if (pt.subpoints) {
            pt.subpoints.forEach((sp, spi) => {
              flat.push({ id: `${ptId}-sp-${spi}`, path: `${ci + 1}.${pi + 1}.${spi + 1}`, title: sp.title, depth: 2, content: "", source: "empty", generating: false });
            });
          }
        });
      }
    });
    return flat;
  };

  // Analyze with AI
  const analyzeWithAI = async () => {
    if (materials.length === 0 && !promptText.trim()) {
      toast({ title: "Dodaj materiały", description: "Wrzuć pliki, wklej tekst lub wpisz prompt.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    setSuggestion(null);
    try {
      // Fetch URL content
      const urlMats = materials.filter((m) => m.type === "url");
      for (const um of urlMats) {
        const urlStr = um.content.replace("[URL do pobrania] ", "");
        try {
          const { data } = await invokeGenerateEbook({ action: "import-url", url: urlStr });
          if (data?.text) { um.content = data.text; um.name = `Treść z: ${urlStr}`; }
        } catch { /* keep original */ }
      }
      setMaterials([...materials]);

      const { data, error } = await invokeGenerateEbook({ action: "analyze", materials: allContent(), structure: structureConfig });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuggestion(data);
      setEditedTitle(data.title || "");
      setEditedSubtitle(data.subtitle || "");
      setEditedAuthor(data.author_name || "");
      setSections(flattenSuggestion(data));
      setStep("review");
    } catch (err: any) {
      toast({ title: "Błąd analizy", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate content for a single section
  const generateSectionContent = async (sectionId: string) => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, generating: true } : s));

    try {
      const sec = sections[idx];
      const { data, error } = await invokeGenerateEbook({
          action: "generate-section",
          bookTitle: editedTitle || suggestion?.title,
          materials: allContent().slice(0, 8000),
          sectionPath: sec.path,
          sectionTitle: sec.title,
          contextBefore: idx > 0 ? sections[idx - 1].title : "",
          contextAfter: idx < sections.length - 1 ? sections[idx + 1].title : "",
          totalSections: sections.length,
          currentIndex: idx,
        });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, content: data.content, source: "ai", generating: false } : s));
    } catch (err: any) {
      toast({ title: "Błąd generowania", description: err.message, variant: "destructive" });
      setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, generating: false } : s));
    }
  };

  // Generate ALL empty sections — one by one to avoid timeouts
  const generateAllContent = async () => {
    const emptySections = sections.filter((s) => s.source === "empty" && s.depth > 0);
    if (emptySections.length === 0) {
      toast({ title: "Wszystkie sekcje mają już treść" });
      return;
    }
    setGeneratingAll(true);
    setGeneratingProgress({ current: 0, total: emptySections.length });

    try {
      for (let i = 0; i < emptySections.length; i++) {
        const sec = emptySections[i];
        const idx = sections.findIndex((s) => s.id === sec.id);
        setGeneratingProgress({ current: i + 1, total: emptySections.length });

        // Mark as generating
        setSections((prev) => prev.map((s) => s.id === sec.id ? { ...s, generating: true } : s));

        const { data, error } = await invokeGenerateEbook({
            action: "generate-section",
            bookTitle: editedTitle || suggestion?.title,
            materials: allContent().slice(0, 8000),
            sectionPath: sec.path,
            sectionTitle: sec.title,
            contextBefore: idx > 0 ? sections[idx - 1].title : "",
            contextAfter: idx < sections.length - 1 ? sections[idx + 1].title : "",
            totalSections: sections.length,
            currentIndex: idx,
            sources: getSourceUrls(),
          });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setSections((prev) => prev.map((s) => s.id === sec.id ? { ...s, content: data.content || "", source: "ai", generating: false } : s));
      }

      toast({ title: "Wygenerowano treść dla wszystkich sekcji!" });
    } catch (err: any) {
      toast({ title: "Błąd generowania", description: err.message, variant: "destructive" });
      // Stop generating flags on error
      setSections((prev) => prev.map((s) => ({ ...s, generating: false })));
    } finally {
      setGeneratingAll(false);
      setGeneratingProgress({ current: 0, total: 0 });
    }
  };

  // Update section content manually
  const updateSectionContent = (sectionId: string, content: string) => {
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, content, source: content ? "user" : "empty" } : s));
  };

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Create project
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

      // Group sections into chapters
      const chapterSections: FlatSection[][] = [];
      let currentChapter: FlatSection[] = [];
      for (const sec of sections) {
        if (sec.depth === 0) {
          if (currentChapter.length > 0) chapterSections.push(currentChapter);
          currentChapter = [sec];
        } else {
          currentChapter.push(sec);
        }
      }
      if (currentChapter.length > 0) chapterSections.push(currentChapter);

      for (let i = 0; i < chapterSections.length; i++) {
        const group = chapterSections[i];
        const blocks: any[] = [];
        for (const sec of group) {
          const headingLevel = Math.min(sec.depth + 1, 3) as 1 | 2 | 3;
          blocks.push({ id: crypto.randomUUID(), type: "heading", content: sec.title, level: headingLevel });
          if (sec.content) {
            blocks.push({ id: crypto.randomUUID(), type: "text", content: sec.content });
          }
        }
        await supabase.from("chapters").insert({
          project_id: (project as any).id,
          title: group[0].title,
          sort_order: i,
          blocks,
        } as any);
      }

      // Add bibliography chapter if there are URL sources
      const sources = getSourceUrls();
      if (sources.length > 0) {
        const bibBlocks: any[] = [
          { id: crypto.randomUUID(), type: "heading", content: "Bibliografia i źródła", level: 1 },
          { id: crypto.randomUUID(), type: "text", content: `<p>Niniejszy e-book został opracowany na podstawie następujących źródeł:</p><ol>${sources.map((s, i) => `<li><strong>[${i + 1}]</strong> ${s.title} — <a href="${s.url}" target="_blank">${s.url}</a></li>`).join("")}</ol><p><em>Wszystkie źródła zostały wykorzystane zgodnie z prawem cytatu (art. 29 ustawy o prawie autorskim i prawach pokrewnych). Treść e-booka stanowi opracowanie autorskie inspirowane powyższymi materiałami.</em></p>` },
        ];
        await supabase.from("chapters").insert({
          project_id: (project as any).id,
          title: "Bibliografia i źródła",
          sort_order: chapterSections.length,
          blocks: bibBlocks,
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

  const materialIcons: Record<string, any> = { file: FileText, text: FileText, url: Globe, prompt: Sparkles };

  const contentStats = {
    total: sections.filter((s) => s.depth > 0).length,
    filled: sections.filter((s) => s.depth > 0 && s.source !== "empty").length,
    aiGenerated: sections.filter((s) => s.source === "ai").length,
    userWritten: sections.filter((s) => s.source === "user").length,
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => step === "materials" ? navigate("/") : setStep(step === "content" ? "review" : "materials")} className="text-muted-foreground gap-2">
            <ArrowLeft className="h-4 w-4" /> {step === "materials" ? "Powrót" : "Wstecz"}
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Nowy e-book</span>
          </div>
          {/* Steps indicator */}
          <div className="flex items-center gap-2 ml-6">
            {["materials", "review", "content"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${step === s ? "bg-primary" : i < ["materials", "review", "content"].indexOf(step) ? "bg-primary/50" : "bg-muted-foreground/30"}`} />
                {i < 2 && <div className="w-6 h-px bg-border" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* ========== STEP 1: MATERIALS ========== */}
        {step === "materials" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">Wrzuć materiały</h2>
              <p className="text-muted-foreground text-sm mb-6">Dodaj pliki, wklej tekst, podaj linki — AI przeanalizuje i zaproponuje strukturę e-booka.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-card/50">
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-foreground">Wgraj pliki</span>
                  <span className="text-xs text-muted-foreground">.txt, .pdf, .docx</span>
                  <input type="file" multiple accept=".txt,.pdf,.docx,.md" onChange={handleFiles} className="hidden" />
                </label>
                <button onClick={() => setShowPaste(!showPaste)} className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-card/50">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-foreground">Wklej tekst</span>
                  <span className="text-xs text-muted-foreground">kopiuj-wklej</span>
                </button>
                <button onClick={() => setShowUrl(!showUrl)} className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 cursor-pointer transition-colors bg-card/50">
                  <Link2 className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-foreground">Dodaj link</span>
                  <span className="text-xs text-muted-foreground">URL artykułu</span>
                </button>
              </div>

              {showPaste && (
                <div className="bg-card rounded-xl border border-border/50 p-4 mb-4 space-y-3">
                  <Textarea placeholder="Wklej tutaj swój tekst..." value={pasteText} onChange={(e) => setPasteText(e.target.value)} className="bg-secondary border-border min-h-[120px]" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addPaste} className="bg-gradient-gold text-primary-foreground">Dodaj tekst</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowPaste(false); setPasteText(""); }}>Anuluj</Button>
                  </div>
                </div>
              )}

              {showUrl && (
                <div className="bg-card rounded-xl border border-border/50 p-4 mb-4 space-y-3">
                  <Input placeholder="https://youtube.com/watch?v=... lub https://artykul.pl/..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="bg-secondary border-border" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addUrl} className="bg-gradient-gold text-primary-foreground">Dodaj link</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowUrl(false); setUrlInput(""); }}>Anuluj</Button>
                  </div>
                </div>
              )}

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
                        <button onClick={() => removeMaterial(m.id)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                Wytyczne dla AI <span className="text-muted-foreground font-normal text-sm">(opcjonalnie)</span>
              </h2>
              <Textarea
                placeholder='Np. "Stwórz poradnik jak naprawić samochód bez narzędzi" lub "E-book o marketingu od podstaw do zaawansowanych strategii"'
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="bg-card border-border min-h-[100px]"
              />
            </div>

            {/* Structure configuration */}
            <div className="bg-card rounded-xl border border-border/50 p-6 space-y-5">
              <h2 className="font-display text-xl font-bold text-foreground">Konfiguracja struktury</h2>
              <p className="text-sm text-muted-foreground -mt-3">Wybierz jakie elementy ma mieć Twój e-book.</p>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Liczba rozdziałów: {structureConfig.chapters}</label>
                <Slider
                  value={[structureConfig.chapters]}
                  onValueChange={([v]) => setStructureConfig((p) => ({ ...p, chapters: v }))}
                  min={3}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>3</span><span>20</span>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Podrozdziały</p>
                  <p className="text-xs text-muted-foreground">Każdy rozdział podzielony na podrozdziały</p>
                </div>
                <Switch checked={structureConfig.hasSubchapters} onCheckedChange={(v) => setStructureConfig((p) => ({ ...p, hasSubchapters: v }))} />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Punkty</p>
                  <p className="text-xs text-muted-foreground">Punkty w {structureConfig.hasSubchapters ? "podrozdziałach" : "rozdziałach"}</p>
                </div>
                <Switch checked={structureConfig.hasPoints} onCheckedChange={(v) => setStructureConfig((p) => ({ ...p, hasPoints: v }))} />
              </div>

              {structureConfig.hasPoints && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Podpunkty</p>
                    <p className="text-xs text-muted-foreground">Dodatkowy poziom szczegółowości w punktach</p>
                  </div>
                  <Switch checked={structureConfig.hasSubpoints} onCheckedChange={(v) => setStructureConfig((p) => ({ ...p, hasSubpoints: v }))} />
                </div>
              )}
            </div>

            <Button
              onClick={analyzeWithAI}
              disabled={analyzing || (materials.length === 0 && !promptText.trim())}
              className="w-full h-14 text-lg bg-gradient-gold text-primary-foreground hover:opacity-90 gap-3"
            >
              {analyzing ? (<><Loader2 className="h-5 w-5 animate-spin" /> AI analizuje materiały...</>) : (<><Sparkles className="h-5 w-5" /> Generuj strukturę e-booka</>)}
            </Button>
          </div>
        )}

        {/* ========== STEP 2: REVIEW STRUCTURE ========== */}
        {step === "review" && suggestion && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Check className="h-5 w-5 text-green-500" />
                <h2 className="font-display text-2xl font-bold text-foreground">Zaproponowana struktura</h2>
              </div>
              <p className="text-muted-foreground text-sm">Edytuj tytuły lub zatwierdź i przejdź do generowania treści.</p>
            </div>

            <div className="bg-card rounded-xl border border-border/50 p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Tytuł e-booka</label>
                <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="bg-secondary border-border text-lg font-display" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Podtytuł</label>
                <Input value={editedSubtitle} onChange={(e) => setEditedSubtitle(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Autor</label>
                <Input value={editedAuthor} onChange={(e) => setEditedAuthor(e.target.value)} className="bg-secondary border-border" placeholder="Twoje imię i nazwisko..." />
              </div>
            </div>

            {/* Structure tree */}
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-3">Struktura ({sections.length} sekcji)</h3>
              <div className="space-y-1">
                {sections.map((sec) => (
                  <div key={sec.id} className="flex items-center gap-2 bg-card rounded-lg border border-border/50 px-4 py-2.5" style={{ paddingLeft: `${16 + sec.depth * 24}px` }}>
                    <span className="text-xs font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">{sec.path}</span>
                    <span className={`text-sm text-foreground flex-1 ${sec.depth === 0 ? "font-semibold" : ""}`}>{sec.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setSuggestion(null); setStep("materials"); }} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Wróć
              </Button>
              <Button variant="outline" onClick={analyzeWithAI} disabled={analyzing} className="gap-2">
                <RefreshCw className="h-4 w-4" /> {analyzing ? "Generuję..." : "Generuj ponownie"}
              </Button>
              <Button onClick={() => setStep("content")} className="gap-2 bg-gradient-gold text-primary-foreground ml-auto">
                <Sparkles className="h-4 w-4" /> Przejdź do treści
              </Button>
            </div>
          </div>
        )}

        {/* ========== STEP 3: CONTENT GENERATION ========== */}
        {step === "content" && suggestion && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">Treść e-booka</h2>
              <p className="text-muted-foreground text-sm">Generuj treść przez AI lub pisz sam. Każdą sekcję możesz edytować niezależnie.</p>
            </div>

            {/* Stats & bulk actions */}
            <div className="bg-card rounded-xl border border-border/50 p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-foreground">{contentStats.filled}/{contentStats.total} sekcji z treścią</span>
                </div>
                {contentStats.aiGenerated > 0 && (
                  <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{contentStats.aiGenerated} od AI</span>
                )}
                {contentStats.userWritten > 0 && (
                  <span className="text-xs bg-green-500/10 text-green-500 rounded-full px-2 py-0.5">{contentStats.userWritten} własnych</span>
                )}
                <Button
                  size="sm"
                  onClick={generateAllContent}
                  disabled={generatingAll}
                  className="ml-auto gap-2 bg-gradient-gold text-primary-foreground"
                >
                  {generatingAll ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generuję {generatingProgress.current}/{generatingProgress.total}...</>) : (<><Wand2 className="h-4 w-4" /> Generuj wszystko z AI</>)}
                </Button>
              </div>
              {generatingAll && (
                <div className="space-y-1">
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${generatingProgress.total > 0 ? (generatingProgress.current / generatingProgress.total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Generuję sekcję {generatingProgress.current} z {generatingProgress.total}... To może potrwać kilka minut.</p>
                </div>
              )}
            </div>

            {/* Sections list */}
            <div className="space-y-2">
              {sections.map((sec) => {
                const isExpanded = expandedSections.has(sec.id);
                const isChapter = sec.depth === 0;

                return (
                  <div key={sec.id} className={`bg-card rounded-xl border border-border/50 overflow-hidden ${isChapter ? "border-l-4 border-l-primary" : ""}`}>
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                      style={{ paddingLeft: `${16 + sec.depth * 20}px` }}
                      onClick={() => !isChapter && toggleExpand(sec.id)}
                    >
                      {!isChapter && (
                        isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-xs font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">{sec.path}</span>
                      <span className={`text-sm flex-1 ${isChapter ? "font-bold text-foreground" : "text-foreground"}`}>{sec.title}</span>

                      {/* Status */}
                      {sec.source === "ai" && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">AI</span>}
                      {sec.source === "user" && <span className="text-xs bg-green-500/10 text-green-500 rounded-full px-2 py-0.5">Własne</span>}
                      {sec.source === "empty" && !isChapter && (
                        <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">Puste</span>
                      )}

                      {!isChapter && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateSectionContent(sec.id)}
                            disabled={sec.generating}
                            className="h-7 text-xs gap-1 text-primary"
                          >
                            {sec.generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                            AI
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Expanded content area */}
                    {!isChapter && isExpanded && (
                      <div className="px-4 pb-4 border-t border-border/30" style={{ paddingLeft: `${16 + sec.depth * 20}px` }}>
                        <Textarea
                          value={sec.content}
                          onChange={(e) => updateSectionContent(sec.id, e.target.value)}
                          placeholder="Wpisz treść sekcji lub kliknij AI aby wygenerować..."
                          className="mt-3 min-h-[200px] bg-secondary border-border text-sm"
                        />
                        {sec.content && (
                          <p className="text-xs text-muted-foreground mt-1">{sec.content.split(/\s+/).length} słów</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep("review")} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Wróć do struktury
              </Button>
              <Button
                onClick={createProject}
                disabled={creating || generatingAll || contentStats.filled === 0}
                className="gap-2 bg-gradient-gold text-primary-foreground ml-auto"
                title={contentStats.filled === 0 ? "Wygeneruj najpierw treść sekcji" : ""}
              >
                {creating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Tworzę...</>) : (<><Check className="h-4 w-4" /> Utwórz e-book ({contentStats.filled}/{contentStats.total} sekcji)</>)}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
