import { useMemo, useRef, useEffect, useState } from "react";
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

const MM_TO_PX = 96 / 25.4;
const CANVAS_SCALE = 0.75;

// Estimate block height in scaled px
function estimateBlockHeight(block: Block, template: Template, contentWidth: number): number {
  const scale = CANVAS_SCALE;
  if (block.type === "spacer") return (block.height || 40) * scale;
  if (block.type === "chapter-break") return 0; // handled as page break
  if (block.type === "image") {
    const imgWidth = ((block.width || 100) / 100) * contentWidth;
    return imgWidth * 0.6 + 8; // rough aspect ratio
  }
  if (block.type === "heading") {
    const sizes: Record<number, number> = { 1: 36, 2: 26, 3: 21 };
    const fontSize = sizes[block.level || 2] || 26;
    const text = block.content || "";
    const charsPerLine = Math.floor(contentWidth / (fontSize * 0.55 * scale));
    const lines = Math.max(1, Math.ceil(text.length / Math.max(charsPerLine, 1)));
    return lines * fontSize * 1.3 * scale + template.spacing.paragraphGap;
  }
  if (block.type === "text") {
    const text = block.content || "";
    // Strip HTML tags for length estimation
    const plainText = text.replace(/<[^>]*>/g, "");
    const fontSize = 16;
    const charsPerLine = Math.floor(contentWidth / (fontSize * 0.5 * scale));
    const lines = Math.max(1, Math.ceil(plainText.length / Math.max(charsPerLine, 1)));
    return lines * fontSize * template.spacing.lineHeight * scale + template.spacing.paragraphGap;
  }
  return 40;
}

export function CenterCanvas({
  chapter, template, selectedBlockId, onSelectBlock,
  onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock, pageSize,
  onGenerateContent, isGenerating, onGenerateImage,
  footerConfig,
}: Props) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
  const pageWidthPx = size.width * MM_TO_PX * CANVAS_SCALE;
  const pageHeightPx = size.height * MM_TO_PX * CANVAS_SCALE;
  const marginPx = template.spacing.margin * CANVAS_SCALE;
  const contentWidth = pageWidthPx - marginPx * 2;
  const footerHeight = 28;

  const showPageNumbers = footerConfig?.showPageNumbers ?? true;
  const usableHeight = pageHeightPx - marginPx * 2 - (showPageNumbers ? footerHeight : 0);

  // Split blocks into pages using height estimation + chapter-break markers
  const pages = useMemo(() => {
    if (!chapter) return [];
    const result: Block[][] = [[]];
    let currentHeight = 0;

    for (const block of chapter.blocks) {
      if (block.type === "chapter-break") {
        result.push([]);
        currentHeight = 0;
        continue;
      }

      const blockH = estimateBlockHeight(block, template, contentWidth);

      if (currentHeight + blockH > usableHeight && result[result.length - 1].length > 0) {
        result.push([]);
        currentHeight = 0;
      }

      result[result.length - 1].push(block);
      currentHeight += blockH;
    }

    return result;
  }, [chapter?.blocks, template, contentWidth, usableHeight]);

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
        {/* Generate content CTA */}
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
              height: pageHeightPx,
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
            {/* Content area - no internal scroll, content is split across pages */}
            <div
              className="overflow-hidden"
              style={{
                padding: `${marginPx}px`,
                height: pageHeightPx - (showPageNumbers ? footerHeight : 0),
              }}
            >
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
                        ? "ring-2 ring-blue-400/50 ring-offset-1"
                        : "hover:ring-1 hover:ring-blue-200/40"
                    }`}
                    style={{
                      marginBottom: template.spacing.paragraphGap,
                      padding: "2px 4px",
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
                    {/* Block controls */}
                    {selectedBlockId === block.id && (
                      <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, -1); }}
                          className="p-0.5 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 shadow-sm"
                          disabled={idx === 0 && pageIndex === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 1); }}
                          className="p-0.5 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 shadow-sm"
                          disabled={idx === pageBlocks.length - 1 && pageIndex === pages.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                          className="p-0.5 rounded bg-white border border-gray-200 text-gray-400 hover:text-red-500 shadow-sm"
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
                  padding: `6px`,
                  fontFamily: template.bodyFont,
                  color: template.colors.text,
                }}
              >
                {pageIndex + 1}
              </div>
            )}
          </div>
        ))}

        <div className="h-8 shrink-0" />
      </div>
    </div>
  );
}
