import { useRef, useState, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TEMPLATES, PAGE_SIZES, FONT_OPTIONS } from "@/lib/templates";
import type { Block, ProjectData } from "@/lib/blocks";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
  selectedBlock: Block | null;
  onUpdateBlock: (updates: Partial<Block>) => void;
}

export function RightPanel({ project, onUpdateProject, selectedBlock, onUpdateBlock }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<{ name: string; url: string }[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadLibrary = async () => {
    setLoadingLibrary(true);
    try {
      const { data, error } = await supabase.storage.from("ebook-materials").list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      const images = (data || [])
        .filter((f) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name))
        .map((f) => ({
          name: f.name,
          url: supabase.storage.from("ebook-materials").getPublicUrl(f.name).data.publicUrl,
        }));
      setLibraryImages(images);
    } catch {
      // silent
    } finally {
      setLoadingLibrary(false);
    }
  };

  useEffect(() => {
    if (showLibrary) loadLibrary();
  }, [showLibrary]);

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

  const currentTemplate = TEMPLATES[project.template || "modern"] || TEMPLATES.modern;
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
            {/* Alignment — for all visual blocks */}
            {(selectedBlock.type === "heading" || selectedBlock.type === "text" || selectedBlock.type === "image") && (
              <div className="mb-3">
                <Label className="text-xs text-muted-foreground">Wyrównanie</Label>
                <div className="flex gap-1 mt-1">
                  {([
                    { value: "left", icon: AlignLeft },
                    { value: "center", icon: AlignCenter },
                    { value: "right", icon: AlignRight },
                  ] as const).map(({ value, icon: Icon }) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      className={`flex-1 h-7 px-0 ${(selectedBlock.align || "left") === value ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground"}`}
                      onClick={() => onUpdateBlock({ align: value })}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </Button>
                  ))}
                </div>
              </div>
            )}
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
                {/* Preview */}
                {selectedBlock.url && (
                  <div className="rounded-lg overflow-hidden border border-border/50 bg-secondary">
                    <img src={selectedBlock.url} alt="" className="w-full h-auto max-h-32 object-cover" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border text-xs gap-1.5"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    Wgraj
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-border text-xs gap-1.5"
                    onClick={() => setShowLibrary(!showLibrary)}
                  >
                    <ImageIcon className="h-3 w-3" />
                    Biblioteka
                  </Button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

                {/* Media Library */}
                {showLibrary && (
                  <div className="border border-border/50 rounded-lg overflow-hidden">
                    <div className="px-2 py-1.5 bg-secondary/50 border-b border-border/30 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">Biblioteka mediów</span>
                      {loadingLibrary && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                    </div>
                    <ScrollArea className="max-h-48">
                      {libraryImages.length === 0 && !loadingLibrary ? (
                        <p className="text-xs text-muted-foreground p-3 text-center">Brak obrazów. Wgraj pierwszy!</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-1 p-1.5">
                          {libraryImages.map((img) => (
                            <button
                              key={img.name}
                              onClick={() => {
                                onUpdateBlock({ url: img.url });
                                setShowLibrary(false);
                              }}
                              className={`relative rounded overflow-hidden border transition-all hover:ring-2 hover:ring-primary/50 aspect-square ${
                                selectedBlock.url === img.url ? "ring-2 ring-primary" : "border-border/30"
                              }`}
                            >
                              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}

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
            {(selectedBlock.type === "heading" || selectedBlock.type === "text") && (
              <div className="space-y-3 mt-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Kolor tekstu (cały blok)</Label>
                  <Input
                    type="color"
                    value={selectedBlock.textColor || currentTemplate.colors.text}
                    onChange={(e) => onUpdateBlock({ textColor: e.target.value })}
                    className="h-8 w-full mt-1 cursor-pointer"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Kolor tła bloku</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={selectedBlock.bgColor || "#ffffff"}
                      onChange={(e) => onUpdateBlock({ bgColor: e.target.value })}
                      className="h-8 flex-1 cursor-pointer"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onUpdateBlock({ bgColor: "transparent" })}
                    >
                      Brak
                    </Button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">💡 Zaznacz tekst aby kolorować pojedyncze wyrazy</p>
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

        {/* Fonts */}
        <section>
          <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-3">Czcionki</h4>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nagłówki</Label>
              <Select
                value={currentTemplate.headingFont}
                onValueChange={(v) => {
                  // Update template fonts by creating custom override
                  const tmpl = { ...currentTemplate, headingFont: v };
                  TEMPLATES[currentTemplate.id] = tmpl;
                  onUpdateProject({ template: currentTemplate.id });
                }}
              >
                <SelectTrigger className="bg-secondary border-border h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span style={{ fontFamily: f.value }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Treść</Label>
              <Select
                value={currentTemplate.bodyFont}
                onValueChange={(v) => {
                  const tmpl = { ...currentTemplate, bodyFont: v };
                  TEMPLATES[currentTemplate.id] = tmpl;
                  onUpdateProject({ template: currentTemplate.id });
                }}
              >
                <SelectTrigger className="bg-secondary border-border h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <span style={{ fontFamily: f.value }}>{f.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>
        </section>
      </div>
    </div>
  );
}
