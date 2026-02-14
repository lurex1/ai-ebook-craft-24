import { useRef, useEffect, useState, useMemo } from "react";
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
  onGenerateImage?: (contextText: string) => void;
  footerConfig?: Record<string, any>;
  headerConfig?: Record<string, any>;
  projectTitle?: string;
  authorName?: string;
}

const BLOCK_TOOLS: { type: BlockType; icon: React.ElementType; label: string }[] = [
  { type: "heading", icon: Heading1, label: "Nagłówek" },
  { type: "text", icon: Type, label: "Tekst" },
  { type: "image", icon: ImageIcon, label: "Obraz" },
  { type: "spacer", icon: MinusSquare, label: "Odstęp" },
  { type: "chapter-break", icon: Scissors, label: "Podział strony" },
];

// mm to px conversion at 96dpi
const MM_TO_PX = 96 / 25.4;
const CANVAS_SCALE = 0.75; // scale down pages to fit nicely

export function CenterCanvas({
  chapter, template, selectedBlockId, onSelectBlock,
  onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock, pageSize,
  onGenerateContent, isGenerating, onGenerateImage,
  footerConfig, headerConfig, projectTitle, authorName,
}: Props) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
  const pageWidthPx = size.width * MM_TO_PX * CANVAS_SCALE;
  const pageHeightPx = size.height * MM_TO_PX * CANVAS_SCALE;
  const marginPx = template.spacing.margin * CANVAS_SCALE;

  const showPageNumbers = footerConfig?.showPageNumbers ?? true;
  const showTitle = headerConfig?.showTitle ?? true;
  const showAuthor = headerConfig?.showAuthor ?? true;

  // Split blocks into pages based on chapter-break markers
  const pages = useMemo(() => {
    if (!chapter) return [];
    const result: Block[][] = [[]];
    for (const block of chapter.blocks) {
      if (block.type === "chapter-break") {
        result.push([]);
      } else {
        result[result.length - 1].push(block);
      }
    }
    return result;
  }, [chapter?.blocks]);

  const needsContent = chapter && chapter.blocks.some((b) => b.type === "heading") && !chapter.blocks.some((b) => b.type === "text" && b.content && b.content.trim().length > 50);

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
        <span className="text-xs text-muted-foreground mr-2">Dodaj:</span>
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

      {/* Canvas scroll area */}
      <div
        className="flex-1 overflow-y-auto py-8 flex flex-col items-center gap-8"
        style={{ background: "hsl(220 15% 90%)" }}
        onClick={() => onSelectBlock(null)}
      >
        {/* Generate content CTA if needed */}
        {needsContent && onGenerateContent && (
          <div
            className="flex flex-col items-center gap-3 py-6 px-8 rounded-xl border-2 border-dashed"
            style={{ borderColor: template.colors.accent, maxWidth: pageWidthPx }}
            onClick={(e) => e.stopPropagation()}
          >
            <Wand2 className="h-7 w-7" style={{ color: template.colors.accent }} />
            <p className="text-sm font-medium" style={{ color: "#333" }}>Ten rozdział ma tylko nagłówki</p>
            <Button
              onClick={onGenerateContent}
              disabled={isGenerating}
              className="gap-2 bg-gradient-gold text-primary-foreground"
              size="sm"
            >
              <Wand2 className="h-4 w-4" /> Generuj treść AI
            </Button>
          </div>
        )}

        {/* Pages */}
        {pages.map((pageBlocks, pageIndex) => (
          <div
            key={pageIndex}
            className="relative flex-shrink-0"
            style={{
              width: pageWidthPx,
              minHeight: pageHeightPx,
              backgroundColor: template.colors.bg,
              boxShadow: "0 2px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
              borderRadius: 2,
              fontFamily: template.bodyFont,
              color: template.colors.text,
              lineHeight: template.spacing.lineHeight,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) onSelectBlock(null);
            }}
          >
            {/* Header */}
            {(showTitle || showAuthor) && (
              <div
                className="flex justify-between items-center text-[10px] opacity-50"
                style={{
                  padding: `${marginPx * 0.5}px ${marginPx}px`,
                  paddingBottom: 0,
                  fontFamily: template.bodyFont,
                  color: template.colors.text,
                }}
              >
                {showTitle && <span>{projectTitle || ""}</span>}
                {showAuthor && <span>{authorName || ""}</span>}
              </div>
            )}

            {/* Content area */}
            <div style={{ padding: `${marginPx * 0.6}px ${marginPx}px ${marginPx}px` }}>
              {pageBlocks.length === 0 ? (
                <div
                  className="flex items-center justify-center h-32 text-sm"
                  style={{ color: template.colors.accent, opacity: 0.6 }}
                >
                  Pusta strona — dodaj bloki powyżej
                </div>
              ) : (
                pageBlocks.map((block, idx) => (
                  <div
                    key={block.id}
                    className={`relative group cursor-pointer transition-all duration-150 rounded-sm ${
                      selectedBlockId === block.id
                        ? "ring-2 ring-blue-400/50 ring-offset-2 bg-blue-50/30"
                        : "hover:bg-black/[0.02]"
                    }`}
                    style={{
                      marginBottom: template.spacing.paragraphGap,
                      padding: "4px 6px",
                    }}
                    onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}
                  >
                    <BlockRenderer
                      block={block}
                      template={template}
                      onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                      isSelected={selectedBlockId === block.id}
                      onGenerateImage={onGenerateImage}
                    />
                    {/* Block controls - subtle side buttons */}
                    {selectedBlockId === block.id && (
                      <div className="absolute -right-9 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ opacity: selectedBlockId === block.id ? 1 : undefined }}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, -1); }}
                          className="p-1 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 shadow-sm"
                          disabled={idx === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 1); }}
                          className="p-1 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 shadow-sm"
                          disabled={idx === pageBlocks.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                          className="p-1 rounded bg-white border border-gray-200 text-gray-400 hover:text-red-500 shadow-sm"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer with page number */}
            {showPageNumbers && (
              <div
                className="absolute bottom-0 left-0 right-0 text-center text-[10px] opacity-40"
                style={{
                  padding: `${marginPx * 0.4}px`,
                  fontFamily: template.bodyFont,
                  color: template.colors.text,
                }}
              >
                {pageIndex + 1}
              </div>
            )}
          </div>
        ))}

        {/* Spacer at bottom for scroll */}
        <div className="h-8 shrink-0" />
      </div>
    </div>
  );
}
