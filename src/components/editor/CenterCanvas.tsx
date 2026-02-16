import { useMemo, useState, useRef, useCallback } from "react";
import { Heading1, Type, ImageIcon, MinusSquare, Scissors, ChevronUp, ChevronDown, Trash2, Wand2, Plus, GripVertical } from "lucide-react";
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
  onAddBlock: (type: BlockType, afterBlockId?: string) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, dir: -1 | 1) => void;
  onReorderBlocks?: (fromIndex: number, toIndex: number) => void;
  pageSize: string;
  onGenerateContent?: () => void;
  isGenerating?: boolean;
  onGenerateImage?: (contextText: string) => void;
  footerConfig?: Record<string, any>;
  headerConfig?: Record<string, any>;
  projectTitle?: string;
  authorName?: string;
  watermarkText?: string;
  pricePerPage?: number;
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

function estimateBlockHeight(block: Block, template: Template, contentWidth: number): number {
  const scale = CANVAS_SCALE;
  if (block.type === "spacer") return (block.height || 40) * scale;
  if (block.type === "chapter-break") return 0;
  if (block.type === "image") {
    const imgWidth = ((block.width || 100) / 100) * contentWidth;
    return imgWidth * 0.6 + 8;
  }
  if (block.type === "heading") {
    const sizes: Record<number, number> = { 1: 36, 2: 26, 3: 21 };
    const fontSize = sizes[block.level || 2] || 26;
    const text = (block.content || "").replace(/<[^>]*>/g, "");
    const charsPerLine = Math.floor(contentWidth / (fontSize * 0.55 * scale));
    const lines = Math.max(1, Math.ceil(text.length / Math.max(charsPerLine, 1)));
    return lines * fontSize * 1.3 * scale + template.spacing.paragraphGap + 4;
  }
  if (block.type === "text") {
    const text = block.content || "";
    const plainText = text.replace(/<[^>]*>/g, "");
    const fontSize = 16;
    const charsPerLine = Math.floor(contentWidth / (fontSize * 0.5 * scale));
    const lines = Math.max(1, Math.ceil(plainText.length / Math.max(charsPerLine, 1)));
    const extraElements = (text.match(/<\/li>/g) || []).length * 4;
    const blockquotes = (text.match(/<blockquote>/g) || []).length * 12;
    const tables = (text.match(/<table>/g) || []).length * 60;
    return lines * fontSize * template.spacing.lineHeight * scale + template.spacing.paragraphGap + extraElements + blockquotes + tables;
  }
  return 40;
}

// Inline insert menu between blocks
function InsertMenu({ onInsert, visible }: { onInsert: (type: BlockType) => void; visible: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`flex items-center justify-center transition-all ${visible || open ? "h-6 opacity-100" : "h-0 opacity-0"}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {open ? (
        <div className="flex items-center gap-0.5 bg-card border border-border/60 rounded-md px-1 py-0.5 shadow-sm z-10">
          {BLOCK_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.type}
                onClick={(e) => { e.stopPropagation(); onInsert(tool.type); setOpen(false); }}
                className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                title={tool.label}
              >
                <Icon className="h-3 w-3" />
              </button>
            );
          })}
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          className="h-5 w-5 rounded-full border border-border/40 bg-card text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center justify-center shadow-sm transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function CenterCanvas({
  chapter, template, selectedBlockId, onSelectBlock,
  onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock, onReorderBlocks,
  pageSize, onGenerateContent, isGenerating, onGenerateImage,
  footerConfig, watermarkText, pricePerPage,
}: Props) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
  const pageWidthPx = size.width * MM_TO_PX * CANVAS_SCALE;
  const pageHeightPx = size.height * MM_TO_PX * CANVAS_SCALE;
  const marginPx = template.spacing.margin * CANVAS_SCALE;
  const contentWidth = pageWidthPx - marginPx * 2;
  const footerHeight = 28;

  const showPageNumbers = footerConfig?.showPageNumbers ?? true;
  const usableHeight = pageHeightPx - marginPx * 2 - (showPageNumbers ? footerHeight : 0);

  // Drag and drop state
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", blockId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (blockId !== draggedBlockId) {
      setDropTargetId(blockId);
    }
  }, [draggedBlockId]);

  const handleDrop = useCallback((e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedBlockId || !chapter || draggedBlockId === targetBlockId) {
      setDraggedBlockId(null);
      setDropTargetId(null);
      return;
    }
    const fromIndex = chapter.blocks.findIndex((b) => b.id === draggedBlockId);
    const toIndex = chapter.blocks.findIndex((b) => b.id === targetBlockId);
    if (fromIndex >= 0 && toIndex >= 0 && onReorderBlocks) {
      onReorderBlocks(fromIndex, toIndex);
    }
    setDraggedBlockId(null);
    setDropTargetId(null);
  }, [draggedBlockId, chapter, onReorderBlocks]);

  const handleDragEnd = useCallback(() => {
    setDraggedBlockId(null);
    setDropTargetId(null);
  }, []);

  // Pagination: move whole block to next page if it doesn't fit
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

      // If block doesn't fit and page has content, move ENTIRE block to next page
      if (currentHeight + blockH > usableHeight && result[result.length - 1].length > 0) {
        result.push([]);
        currentHeight = 0;
      }

      result[result.length - 1].push(block);
      currentHeight += blockH;
    }

    return result;
  }, [chapter?.blocks, template, contentWidth, usableHeight]);

  const totalPages = pages.length;
  const estimatedCost = pricePerPage ? (totalPages * pricePerPage).toFixed(2) : null;

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
      {/* Top toolbar */}
      <div className="h-10 border-b border-border/30 bg-card/50 px-3 flex items-center gap-1 shrink-0">
        <span className="text-xs text-muted-foreground mr-2">Wstaw{selectedBlockId ? " po bloku" : ""}:</span>
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

        {/* Page count & cost */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {totalPages} {totalPages === 1 ? "strona" : totalPages < 5 ? "strony" : "stron"}
          </span>
          {estimatedCost && (
            <span className="text-xs font-medium text-primary">
              Koszt: {estimatedCost} PLN
            </span>
          )}
        </div>
      </div>

      {/* Canvas scroll area */}
      <div
        className="flex-1 overflow-y-auto py-8 flex flex-col items-center gap-8"
        style={{ background: "hsl(220 15% 90%)" }}
        onClick={() => onSelectBlock(null)}
      >
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
              overflow: "hidden",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) onSelectBlock(null);
            }}
          >
            <div
              style={{
                padding: `${marginPx}px`,
                minHeight: pageHeightPx - (showPageNumbers ? footerHeight : 0),
                maxHeight: pageHeightPx - (showPageNumbers ? footerHeight : 0),
                overflow: "visible",
              }}
            >
              {pageBlocks.length === 0 ? (
                <div
                  className="flex items-center justify-center h-32 text-sm"
                  style={{ color: template.colors.accent, opacity: 0.6 }}
                >
                  Pusta strona — użyj paska powyżej lub kliknij + między blokami
                </div>
              ) : (
                pageBlocks.map((block) => (
                  <div key={block.id}>
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, block.id)}
                      onDragOver={(e) => handleDragOver(e, block.id)}
                      onDrop={(e) => handleDrop(e, block.id)}
                      onDragEnd={handleDragEnd}
                      className={`relative group cursor-pointer transition-all duration-150 rounded-sm ${
                        selectedBlockId === block.id
                          ? "ring-2 ring-blue-400/50 ring-offset-1"
                          : dropTargetId === block.id
                          ? "ring-2 ring-primary/50 ring-offset-1 bg-primary/5"
                          : draggedBlockId === block.id
                          ? "opacity-40"
                          : "hover:ring-1 hover:ring-blue-200/40"
                      }`}
                      style={{ marginBottom: 0, padding: "2px 4px" }}
                      onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id); }}
                    >
                      {/* Drag handle */}
                      <div
                        className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>

                      <BlockRenderer
                        block={block}
                        template={template}
                        onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                        isSelected={selectedBlockId === block.id}
                        onGenerateImage={onGenerateImage}
                      />
                      {selectedBlockId === block.id && (
                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, -1); }}
                            className="p-0.5 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 shadow-sm"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onMoveBlock(block.id, 1); }}
                            className="p-0.5 rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 shadow-sm"
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
                    {/* Insert menu between blocks */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <InsertMenu
                        onInsert={(type) => onAddBlock(type, block.id)}
                        visible={selectedBlockId === block.id}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Watermark */}
            {watermarkText && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{
                  fontSize: "1.6em",
                  color: "rgba(0,0,0,0.05)",
                  fontFamily: template.bodyFont,
                  transform: "rotate(-30deg)",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.1em",
                }}
              >
                {watermarkText}
              </div>
            )}

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
