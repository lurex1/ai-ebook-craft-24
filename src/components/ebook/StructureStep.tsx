import { useState } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Loader2, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UploadedFile, ChapterConfig, EbookStructure, Chapter } from "./EbookWizard";

interface Props {
  files: UploadedFile[];
  config: ChapterConfig;
  structure: EbookStructure | null;
  setStructure: (s: EbookStructure | null) => void;
  isGenerating: boolean;
  setIsGenerating: (b: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StructureStep({
  files, config, structure, setStructure,
  isGenerating, setIsGenerating, onNext, onBack,
}: Props) {
  const { toast } = useToast();
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const generateStructure = async () => {
    setIsGenerating(true);
    try {
      const fileDescriptions = files.map(f => {
        if (f.content) return `Plik "${f.name}":\n${f.content.slice(0, 3000)}`;
        return `Plik "${f.name}" (typ: ${f.type})`;
      }).join("\n\n");

      const { data, error } = await supabase.functions.invoke("generate-ebook", {
        body: {
          action: "structure",
          materials: fileDescriptions,
          chaptersCount: config.count,
          pointsPerChapter: config.pointsPerChapter,
        },
      });

      if (error) throw error;
      setStructure(data as EbookStructure);
    } catch (err: any) {
      toast({
        title: "Błąd generowania",
        description: err.message || "Spróbuj ponownie",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startEdit = (id: string, currentTitle: string) => {
    setEditingTitle(id);
    setEditValue(currentTitle);
  };

  const saveEdit = (type: "book" | "chapter" | "point", chapterId?: string, pointId?: string) => {
    if (!structure) return;
    const updated = { ...structure };
    if (type === "book") {
      updated.title = editValue;
    } else if (type === "chapter" && chapterId) {
      updated.chapters = updated.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, title: editValue } : ch
      );
    } else if (type === "point" && chapterId && pointId) {
      updated.chapters = updated.chapters.map(ch =>
        ch.id === chapterId
          ? { ...ch, points: ch.points.map(p => p.id === pointId ? { ...p, title: editValue } : p) }
          : ch
      );
    }
    setStructure(updated);
    setEditingTitle(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-bold text-foreground mb-3">
          Struktura <span className="text-gradient-gold">AI</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          AI przeanalizuje materiały i zaproponuje optymalną strukturę e-booka.
        </p>
      </div>

      {!structure && (
        <div className="flex flex-col items-center gap-6">
          <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse-gold">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <Button
            onClick={generateStructure}
            disabled={isGenerating}
            className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2 px-8 py-6 text-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Analizuję materiały...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" /> Wygeneruj strukturę
              </>
            )}
          </Button>
        </div>
      )}

      {structure && (
        <div className="space-y-6">
          {/* Book title */}
          <div className="bg-card rounded-xl p-6 border border-primary/20 glow-gold">
            <p className="text-xs text-primary font-medium uppercase tracking-wider mb-2">Tytuł e-booka</p>
            {editingTitle === "book-title" ? (
              <div className="flex gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={() => saveEdit("book")} className="text-primary">
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h3 className="font-display text-2xl font-bold text-foreground">{structure.title}</h3>
                <button
                  onClick={() => startEdit("book-title", structure.title)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Chapters */}
          {structure.chapters.map((chapter, ci) => (
            <div key={chapter.id} className="bg-card rounded-xl p-5 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                  {ci + 1}
                </span>
                {editingTitle === chapter.id ? (
                  <div className="flex gap-2 flex-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-secondary border-border text-foreground"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" onClick={() => saveEdit("chapter", chapter.id)} className="text-primary">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group flex-1">
                    <h4 className="font-display text-lg font-semibold text-foreground">{chapter.title}</h4>
                    <button
                      onClick={() => startEdit(chapter.id, chapter.title)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-2 ml-11">
                {chapter.points.map((point) => (
                  <div key={point.id} className="flex items-center gap-2 group">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                    {editingTitle === point.id ? (
                      <div className="flex gap-2 flex-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-secondary border-border text-foreground text-sm h-8"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={() => saveEdit("point", chapter.id, point.id)} className="text-primary h-8 w-8">
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-secondary-foreground">{point.title}</span>
                        <button
                          onClick={() => startEdit(point.id, point.title)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Nav */}
      <div className="flex justify-between mt-10">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Wstecz
        </Button>
        {structure && (
          <Button onClick={onNext} className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2 px-6">
            Edytor treści <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
