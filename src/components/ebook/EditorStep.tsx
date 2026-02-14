import { useState } from "react";
import { ArrowLeft, Sparkles, Loader2, Download, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { EbookStructure } from "./EbookWizard";

interface Props {
  structure: EbookStructure;
  setStructure: (s: EbookStructure | null) => void;
  onBack: () => void;
}

export function EditorStep({ structure, setStructure, onBack }: Props) {
  const { toast } = useToast();
  const [activeChapter, setActiveChapter] = useState(0);
  const [activePoint, setActivePoint] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const currentChapter = structure.chapters[activeChapter];
  const currentPoint = currentChapter?.points[activePoint];

  const updateContent = (content: string) => {
    if (!currentChapter || !currentPoint) return;
    const updated = { ...structure };
    updated.chapters = updated.chapters.map((ch, ci) =>
      ci === activeChapter
        ? {
            ...ch,
            points: ch.points.map((p, pi) =>
              pi === activePoint ? { ...p, content } : p
            ),
          }
        : ch
    );
    setStructure(updated);
  };

  const generateContent = async () => {
    if (!currentChapter || !currentPoint) return;
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ebook", {
        body: {
          action: "content",
          bookTitle: structure.title,
          chapterTitle: currentChapter.title,
          pointTitle: currentPoint.title,
          chapterIndex: activeChapter,
          totalChapters: structure.chapters.length,
        },
      });
      if (error) throw error;
      updateContent(data.content);
    } catch (err: any) {
      toast({ title: "Błąd", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAllContent = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ebook", {
        body: {
          action: "full-content",
          structure: structure,
        },
      });
      if (error) throw error;
      setStructure(data as EbookStructure);
      toast({ title: "Gotowe!", description: "Cała treść została wygenerowana." });
    } catch (err: any) {
      toast({ title: "Błąd", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const addPoint = () => {
    const updated = { ...structure };
    updated.chapters = updated.chapters.map((ch, ci) =>
      ci === activeChapter
        ? {
            ...ch,
            points: [
              ...ch.points,
              { id: `p-${Date.now()}`, title: "Nowy punkt", content: "" },
            ],
          }
        : ch
    );
    setStructure(updated);
  };

  const removePoint = (pointIndex: number) => {
    const updated = { ...structure };
    updated.chapters = updated.chapters.map((ch, ci) =>
      ci === activeChapter
        ? { ...ch, points: ch.points.filter((_, pi) => pi !== pointIndex) }
        : ch
    );
    setStructure(updated);
    if (activePoint >= updated.chapters[activeChapter].points.length) {
      setActivePoint(Math.max(0, updated.chapters[activeChapter].points.length - 1));
    }
  };

  const exportPdf = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ebook", {
        body: { action: "export-html", structure },
      });
      if (error) throw error;

      // Open HTML in new window for printing as PDF
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(data.html);
        win.document.close();
      }
      toast({ title: "E-book gotowy!", description: "Użyj Ctrl+P w nowym oknie, aby zapisać jako PDF." });
    } catch (err: any) {
      toast({ title: "Błąd eksportu", description: err.message, variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl font-bold text-foreground mb-3">
          Edytor <span className="text-gradient-gold">treści</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Edytuj, dodawaj i generuj treść każdej sekcji. Gotowy e-book eksportuj do PDF.
        </p>
      </div>

      {/* Auto-generate all */}
      <div className="flex justify-center mb-8 gap-3">
        <Button
          onClick={generateAllContent}
          disabled={isGenerating}
          className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Wygeneruj całą treść
        </Button>
        <Button
          onClick={exportPdf}
          disabled={isExporting}
          variant="outline"
          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Eksportuj PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar - chapters */}
        <div className="bg-card rounded-xl border border-border/50 p-4 max-h-[600px] overflow-y-auto">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">Rozdziały</p>
          {structure.chapters.map((ch, ci) => (
            <div key={ch.id} className="mb-3">
              <button
                onClick={() => { setActiveChapter(ci); setActivePoint(0); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  activeChapter === ci
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-secondary-foreground hover:bg-secondary"
                }`}
              >
                {ci + 1}. {ch.title}
              </button>
              {activeChapter === ci && (
                <div className="ml-4 mt-1 space-y-1">
                  {ch.points.map((pt, pi) => (
                    <div key={pt.id} className="flex items-center gap-1">
                      <button
                        onClick={() => setActivePoint(pi)}
                        className={`flex-1 text-left px-2 py-1.5 rounded text-xs transition-all ${
                          activePoint === pi
                            ? "text-primary bg-primary/5"
                            : "text-muted-foreground hover:text-secondary-foreground"
                        }`}
                      >
                        {pt.title}
                      </button>
                      {ch.points.length > 1 && (
                        <button
                          onClick={() => removePoint(pi)}
                          className="text-muted-foreground hover:text-destructive p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addPoint}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1"
                  >
                    <Plus className="h-3 w-3" /> Dodaj punkt
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="bg-card rounded-xl border border-border/50 p-6">
          {currentPoint && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-primary font-medium uppercase tracking-wider">
                    Rozdział {activeChapter + 1} — Punkt {activePoint + 1}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-foreground mt-1">
                    {currentPoint.title}
                  </h3>
                </div>
                <Button
                  onClick={generateContent}
                  disabled={isGenerating}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                >
                  {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Generuj AI
                </Button>
              </div>
              <Textarea
                value={currentPoint.content}
                onChange={(e) => updateContent(e.target.value)}
                placeholder="Wpisz treść tego punktu lub kliknij 'Generuj AI'..."
                className="min-h-[400px] bg-secondary border-border text-foreground resize-y font-body leading-relaxed"
              />
            </>
          )}
        </div>
      </div>

      {/* Nav */}
      <div className="flex justify-between mt-10">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Wstecz
        </Button>
      </div>
    </div>
  );
}
