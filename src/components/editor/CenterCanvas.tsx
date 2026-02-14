import { Heading1, Type, ImageIcon, MinusSquare, Scissors, ChevronUp, ChevronDown, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Block, BlockType, ChapterData } from "@/lib/blocks";
import type { Template } from "@/lib/templates";
import { BlockRenderer } from "./BlockRenderer";
import { PAGE_SIZES } from "@/lib/templates";

interface Props {
  chapter: ChapterData | null;
  template: Template;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onAddBlock: (type: BlockType) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, dir: -1 | 1) => void;
  pageSize: string;
  onGenerateContent?: () => void;
  isGenerating?: boolean;
}

const BLOCK_TOOLS: { type: BlockType; icon: React.ElementType; label: string }[] = [
  { type: "heading", icon: Heading1, label: "Nagłówek" },
  { type: "text", icon: Type, label: "Tekst" },
  { type: "image", icon: ImageIcon, label: "Obraz" },
  { type: "spacer", icon: MinusSquare, label: "Odstęp" },
  { type: "chapter-break", icon: Scissors, label: "Podział" },
];

export function CenterCanvas({
  chapter, template, selectedBlockId, onSelectBlock,
  onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock, pageSize,
  onGenerateContent, isGenerating,
}: Props) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
  const aspect = size.height / size.width;
  const pageWidth = 620;

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Wybierz rozdział z listy po lewej</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Block toolbar */}
      <div className="h-10 border-b border-border/30 bg-card/50 px-3 flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground mr-2">Dodaj blok:</span>
        {BLOCK_TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Button
              key={tool.type}
              variant="ghost"
              size="sm"
              onClick={() => onAddBlock(tool.type)}
              className="h-7 text-xs text-muted-foreground hover:text-primary gap-1 px-2"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tool.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-y-auto p-6 flex justify-center" style={{ background: "hsl(var(--muted) / 0.3)" }}>
        <div
          className="shadow-lg rounded-sm relative"
          style={{
            width: pageWidth,
            minHeight: pageWidth * aspect,
            backgroundColor: template.colors.bg,
            color: template.colors.text,
            fontFamily: template.bodyFont,
            padding: `${template.spacing.margin * 0.7}px`,
            lineHeight: template.spacing.lineHeight,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelectBlock(null);
          }}
        >
          {chapter.blocks.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-center" style={{ color: template.colors.accent }}>
              <p className="text-sm">Kliknij przycisk powyżej, aby dodać blok treści</p>
            </div>
          ) : chapter.blocks.some((b) => b.type === "heading") && !chapter.blocks.some((b) => b.type === "text" && b.content && b.content.trim().length > 50) && onGenerateContent ? (
            <>
              {chapter.blocks.map((block, idx) => (
                <div key={block.id} style={{ marginBottom: template.spacing.paragraphGap }}>
                  <BlockRenderer block={block} template={template} onUpdate={(updates) => onUpdateBlock(block.id, updates)} isSelected={false} />
                </div>
              ))}
              <div className="flex flex-col items-center gap-3 py-8 border-2 border-dashed rounded-xl mt-4" style={{ borderColor: template.colors.accent }}>
                <Wand2 className="h-8 w-8" style={{ color: template.colors.accent }} />
                <p className="text-sm font-medium" style={{ color: template.colors.heading }}>Ten rozdział ma tylko nagłówki — brak treści</p>
                <p className="text-xs" style={{ color: template.colors.text }}>Kliknij poniżej, aby AI wygenerowało pełną treść dla każdej sekcji</p>
                <Button
                  onClick={onGenerateContent}
                  disabled={isGenerating}
                  className="gap-2 bg-gradient-gold text-primary-foreground mt-2"
                >
                  <Wand2 className="h-4 w-4" /> Generuj treść AI dla tego rozdziału
                </Button>
              </div>
            </>
          ) : (
            chapter.blocks.map((block, idx) => (
              <div
                key={block.id}
                className={`relative group ${
                  selectedBlockId === block.id ? "ring-2 ring-offset-1 rounded" : ""
                }`}
                style={{
                  marginBottom: template.spacing.paragraphGap,
                  ...(selectedBlockId === block.id ? { outline: `2px solid ${template.colors.primary}`, outlineOffset: 2, borderRadius: 4 } : {}),
                }}
                onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}
              >
                <BlockRenderer
                  block={block}
                  template={template}
                  onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                  isSelected={selectedBlockId === block.id}
                />
                {/* Block controls */}
                {selectedBlockId === block.id && (
                  <div className="absolute -right-10 top-0 flex flex-col gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, -1); }}
                      className="p-1 rounded bg-card border border-border text-muted-foreground hover:text-foreground"
                      disabled={idx === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 1); }}
                      className="p-1 rounded bg-card border border-border text-muted-foreground hover:text-foreground"
                      disabled={idx === chapter.blocks.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                      className="p-1 rounded bg-card border border-border text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
