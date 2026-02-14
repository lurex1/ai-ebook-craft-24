import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TEMPLATES, PAGE_SIZES } from "@/lib/templates";
import type { Block, ProjectData } from "@/lib/blocks";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
  selectedBlock: Block | null;
  onUpdateBlock: (updates: Partial<Block>) => void;
}

export function RightPanel({ project, onUpdateProject, selectedBlock, onUpdateBlock }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("ebook-materials").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("ebook-materials").getPublicUrl(path);
      onUpdateBlock({ url: data.publicUrl });
    } catch (err: any) {
      toast({ title: "Błąd", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const headerConfig = project.header_config || {};
  const footerConfig = project.footer_config || {};

  return (
    <div className="w-[280px] border-l border-border/50 bg-card flex flex-col shrink-0 overflow-y-auto">
      <div className="px-4 py-3 border-b border-border/30">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ustawienia</span>
      </div>

      <div className="p-4 space-y-6">
        {/* Block settings when selected */}
        {selectedBlock && (
          <section>
            <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Blok</h4>
            {selectedBlock.type === "heading" && (
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Poziom nagłówka</Label>
                <Select
                  value={String(selectedBlock.level || 2)}
                  onValueChange={(v) => onUpdateBlock({ level: Number(v) as 1 | 2 | 3 })}
                >
                  <SelectTrigger className="bg-secondary border-border h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">H1 — Główny</SelectItem>
                    <SelectItem value="2">H2 — Sekcja</SelectItem>
                    <SelectItem value="3">H3 — Podsekcja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedBlock.type === "image" && (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-border text-xs gap-2"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Wgraj obraz
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <div>
                  <Label className="text-xs text-muted-foreground">URL obrazu</Label>
                  <Input
                    value={selectedBlock.url || ""}
                    onChange={(e) => onUpdateBlock({ url: e.target.value })}
                    className="bg-secondary border-border h-8 text-xs mt-1"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Alt text</Label>
                  <Input
                    value={selectedBlock.alt || ""}
                    onChange={(e) => onUpdateBlock({ alt: e.target.value })}
                    className="bg-secondary border-border h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Szerokość (%)</Label>
                  <Slider
                    value={[selectedBlock.width || 100]}
                    onValueChange={([v]) => onUpdateBlock({ width: v })}
                    min={20}
                    max={100}
                    className="mt-2"
                  />
                </div>
              </div>
            )}
            {selectedBlock.type === "spacer" && (
              <div>
                <Label className="text-xs text-muted-foreground">Wysokość (px)</Label>
                <Slider
                  value={[selectedBlock.height || 40]}
                  onValueChange={([v]) => onUpdateBlock({ height: v })}
                  min={10}
                  max={200}
                  className="mt-2"
                />
                <span className="text-xs text-muted-foreground">{selectedBlock.height || 40}px</span>
              </div>
            )}
            <div className="border-b border-border/30 mt-4" />
          </section>
        )}

        {/* Template */}
        <section>
          <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Szablon</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(TEMPLATES).map((t) => (
              <button
                key={t.id}
                onClick={() => onUpdateProject({ template: t.id })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  project.template === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                <div className="flex gap-1 mb-1.5">
                  {[t.colors.primary, t.colors.bg, t.colors.text, t.colors.accent].map((c, i) => (
                    <div key={i} className="h-3 w-3 rounded-full border border-border/30" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-xs font-medium text-foreground">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Page size */}
        <section>
          <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Strona</h4>
          <Select value={project.page_size} onValueChange={(v) => onUpdateProject({ page_size: v })}>
            <SelectTrigger className="bg-secondary border-border h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAGE_SIZES).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {/* Project info */}
        <section>
          <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Projekt</h4>
          <div className="space-y-2">
            <Input
              value={project.subtitle}
              onChange={(e) => onUpdateProject({ subtitle: e.target.value })}
              placeholder="Podtytuł"
              className="bg-secondary border-border h-8 text-xs"
            />
            <Input
              value={project.author_name}
              onChange={(e) => onUpdateProject({ author_name: e.target.value })}
              placeholder="Autor"
              className="bg-secondary border-border h-8 text-xs"
            />
          </div>
        </section>

        {/* Header */}
        <section>
          <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Nagłówek</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Pokaż tytuł</Label>
              <Switch
                checked={headerConfig.showTitle ?? true}
                onCheckedChange={(v) => onUpdateProject({ header_config: { ...headerConfig, showTitle: v } })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Pokaż autora</Label>
              <Switch
                checked={headerConfig.showAuthor ?? true}
                onCheckedChange={(v) => onUpdateProject({ header_config: { ...headerConfig, showAuthor: v } })}
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <section>
          <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Stopka</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Numery stron</Label>
              <Switch
                checked={footerConfig.showPageNumbers ?? true}
                onCheckedChange={(v) => onUpdateProject({ footer_config: { ...footerConfig, showPageNumbers: v } })}
              />
            </div>
            <Input
              value={footerConfig.copyrightText || "© Paveelo"}
              onChange={(e) => onUpdateProject({ footer_config: { ...footerConfig, copyrightText: e.target.value } })}
              placeholder="Tekst copyright"
              className="bg-secondary border-border h-8 text-xs"
            />
          </div>
        </section>

        {/* AI future features */}
        <section>
          <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">AI (wkrótce)</h4>
          <div className="space-y-1.5">
            {["Przepisz treść", "Podsumuj rozdział", "Rozwiń treść", "Przetłumacz e-book"].map((f) => (
              <button
                key={f}
                className="w-full text-left px-3 py-2 rounded text-xs text-muted-foreground bg-secondary/50 cursor-not-allowed opacity-50"
                disabled
              >
                {f}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
