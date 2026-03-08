import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import {
  Heading1,
  Type,
  ImageIcon,
  MinusSquare,
  Scissors,
  ChevronUp,
  ChevronDown,
  Trash2,
  Wand2,
  Plus,
  GripVertical,
  RotateCcw,
} from "lucide-react";
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
  scrollToBlockId?: string | null;
  onScrollComplete?: () => void;
  onExtractToBlock?: (sourceBlockId: string, html: string) => void;
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
    return lines * fontSize * 1.3 * scale + template.spacing.paragraphGap + 16;
  }
  if (block.type === "text") {
    const text = block.content || "";
    const plainText = text.replace(/<[^>]*>/g, "");
    const fontSize = 16;
    const charsPerLine = Math.floor(contentWidth / (fontSize * 0.5 * scale));
    const newlineCount = (plainText.match(/\n/g) || []).length;
    const wrappedLines = Math.max(1, Math.ceil(plainText.length / Math.max(charsPerLine, 1)));
    const totalLines = Math.max(wrappedLines, newlineCount + 1);
    const liCount = (text.match(/<\/li>/g) || []).length;
    const extraElements = liCount * 10;
    const blockquotes = (text.match(/<blockquote>/g) || []).length * 24;
    const tables = (text.match(/<table>/g) || []).length * 80;
    const pCount = (text.match(/<\/p>/g) || []).length;
    const paragraphSpacing = pCount * 12;
    const codeBlocks = (text.match(/<pre/gi) || []).length;
    const lineH = codeBlocks > 0 ? fontSize * 1.6 : fontSize * template.spacing.lineHeight;
    // 60% safety margin — generous buffer to prevent any overflow
    const raw =
      totalLines * lineH * scale +
      template.spacing.paragraphGap +
      extraElements +
      blockquotes +
      tables +
      paragraphSpacing +
      20;
    return raw * 1.6;
  }
  return 40;
}

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
                onClick={(e) => {
                  e.stopPropagation();
                  onInsert(tool.type);
                  setOpen(false);
                }}
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
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="h-5 w-5 rounded-full border border-border/40 bg-card text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center justify-center shadow-sm transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export function CenterCanvas({
  chapter,
  template,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  onReorderBlocks,
  pageSize,
  onGenerateContent,
  isGenerating,
  onGenerateImage,
  footerConfig,
  watermarkText,
  pricePerPage,
  scrollToBlockId,
  onScrollComplete,
  onExtractToBlock,
}: Props) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
  const pageWidthPx = size.width * MM_TO_PX * CANVAS_SCALE;
  const pageHeightPx = size.height * MM_TO_PX * CANVAS_SCALE;
  const marginPx = template.spacing.margin * CANVAS_SCALE;
  const contentWidth = pageWidthPx - marginPx * 2;
  const footerHeight = 28;

  const showPageNumbers = footerConfig?.showPageNumbers ?? true;
  const usableHeight = pageHeightPx - marginPx * 2 - (showPageNumbers ? footerHeight : 0) - 32; // 32px safety buffer

  const canvasScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollToBlockId && canvasScrollRef.current) {
      const el = canvasScrollRef.current.querySelector(`[data-block-id="${scrollToBlockId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      onScrollComplete?.();
    }
  }, [scrollToBlockId, onScrollComplete]);

  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number } | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Free-form drag via mousedown on grip handle
  const handleGripMouseDown = useCallback(
    (e: React.MouseEvent, blockId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggedBlockId(blockId);
      const startX = e.clientX;
      const startY = e.clientY;

      // Find which page content area this block is in
      const blockEl = (e.currentTarget as HTMLElement).closest("[data-block-id]");
      const pageContentEl = blockEl?.closest("[data-page-content]") as HTMLElement | null;
      if (!pageContentEl) return;

      const block = chapter?.blocks.find((b) => b.id === blockId);
      if (!block) return;

      const contentRect = pageContentEl.getBoundingClientRect();
      const blockRect = blockEl!.getBoundingClientRect();

      // Starting position (either existing posX/posY or current rendered position)
      const startPosX = block.posX ?? (blockRect.left - contentRect.left);
      const startPosY = block.posY ?? (blockRect.top - contentRect.top);

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const newX = Math.max(0, Math.min(contentRect.width - 40, startPosX + dx));
        const newY = Math.max(0, Math.min(contentRect.height - 20, startPosY + dy));
        setDragGhost({ x: ev.clientX, y: ev.clientY });
        onUpdateBlock(blockId, {
          posX: Math.round(newX),
          posY: Math.round(newY),
        });
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        setDraggedBlockId(null);
        setDragGhost(null);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [chapter, onUpdateBlock],
  );

  const resetBlockPosition = useCallback(
    (blockId: string) => {
      onUpdateBlock(blockId, { posX: undefined, posY: undefined } as any);
    },
    [onUpdateBlock],
  );

  const pages = useMemo(() => {
    if (!chapter) return [];
    const result: Block[][] = [[]];
    let currentHeight = 0;

    const splitTextBlock = (block: Block, availableHeight: number): { fit: Block | null; overflow: Block | null } => {
      if (block.type !== "text" || !block.content) return { fit: block, overflow: null };

      const segments = block.content.split(/(?<=<\/p>|<\/ul>|<\/ol>|<\/blockquote>|<\/table>|<\/li>)\s*/);
      if (segments.length <= 1) return { fit: block, overflow: null };

      let fitContent = "";
      let overflowContent = "";
      let foundSplit = false;

      for (const seg of segments) {
        if (foundSplit) {
          overflowContent += (overflowContent ? "\n" : "") + seg;
          continue;
        }
        const testContent = fitContent ? fitContent + "\n" + seg : seg;
        const testBlock: Block = { ...block, id: "test", content: testContent };
        const testH = estimateBlockHeight(testBlock, template, contentWidth);

        if (testH > availableHeight && fitContent) {
          foundSplit = true;
          overflowContent = seg;
        } else {
          fitContent = testContent;
        }
      }

      if (!foundSplit) return { fit: block, overflow: null };

      const fitBlock = fitContent.trim() ? { ...block, id: crypto.randomUUID(), content: fitContent } : null;
      const overflowBlock = overflowContent.trim()
        ? { ...block, id: crypto.randomUUID(), content: overflowContent }
        : null;
      return { fit: fitBlock, overflow: overflowBlock };
    };

    const addBlock = (block: Block) => {
      const blockH = estimateBlockHeight(block, template, contentWidth);
      const remainingHeight = usableHeight - currentHeight;

      if (blockH <= remainingHeight) {
        result[result.length - 1].push(block);
        currentHeight += blockH;
        return;
      }

      if (block.type === "text" && block.content) {
        if (remainingHeight > usableHeight * 0.15 && result[result.length - 1].length > 0) {
          const { fit, overflow } = splitTextBlock(block, remainingHeight);
          if (fit) {
            result[result.length - 1].push(fit);
          }
          if (overflow) {
            result.push([]);
            currentHeight = 0;
            addBlock(overflow);
          } else {
            currentHeight += blockH;
          }
          return;
        }

        if (result[result.length - 1].length > 0) {
          result.push([]);
          currentHeight = 0;
        }

        if (blockH <= usableHeight) {
          result[result.length - 1].push(block);
          currentHeight = blockH;
        } else {
          const { fit, overflow } = splitTextBlock(block, usableHeight);
          if (fit) {
            result[result.length - 1].push(fit);
            currentHeight = estimateBlockHeight(fit, template, contentWidth);
          }
          if (overflow) {
            result.push([]);
            currentHeight = 0;
            addBlock(overflow);
          }
        }
        return;
      }

      if (result[result.length - 1].length > 0) {
        result.push([]);
        currentHeight = 0;
      }
      result[result.length - 1].push(block);
      currentHeight = blockH;
    };

    for (const block of chapter.blocks) {
      if (block.type === "chapter-break") {
        result.push([]);
        currentHeight = 0;
        continue;
      }
      addBlock(block);
    }

    return result;
  }, [chapter?.blocks, template, contentWidth, usableHeight]);

  const totalPages = pages.length;
  const estimatedCost = pricePerPage ? (totalPages * pricePerPage).toFixed(2) : null;

  const needsContent =
    chapter &&
    chapter.blocks.some((b) => b.type === "heading") &&
    !chapter.blocks.some((b) => b.type === "text" && b.content && b.content.trim().length > 50);

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
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {totalPages} {totalPages === 1 ? "strona" : totalPages < 5 ? "strony" : "stron"}
          </span>
          {estimatedCost && <span className="text-xs font-medium text-primary">Koszt: {estimatedCost} PLN</span>}
        </div>
      </div>

      {/* Canvas scroll area */}
      <div
        ref={canvasScrollRef}
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
            <p className="text-sm font-medium" style={{ color: "#333" }}>
              Ten rozdział ma tylko nagłówki
            </p>
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
              overflow: "hidden", // PAGE BOUNDARY — clips anything that escapes
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) onSelectBlock(null);
            }}
          >
            {/* ── Page content area ── */}
            <div
              data-page-content
              ref={(el) => { if (el) pageRefs.current.set(pageIndex, el); }}
              style={{
                position: "absolute",
                top: marginPx,
                left: marginPx,
                right: marginPx,
                bottom: showPageNumbers ? footerHeight : marginPx,
                overflow: "hidden",
              }}
            >
              {/* Flow blocks (no posX/posY) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0, width: "100%", height: "100%" }}>
                {pageBlocks.filter((b) => b.posX == null && b.posY == null).length === 0 &&
                 pageBlocks.filter((b) => b.posX != null || b.posY != null).length === 0 && (
                  <div
                    className="flex items-center justify-center h-32 text-sm"
                    style={{ color: template.colors.accent, opacity: 0.6 }}
                  >
                    Pusta strona — użyj paska powyżej lub kliknij + między blokami
                  </div>
                )}
                {pageBlocks.filter((b) => b.posX == null && b.posY == null).map((block) => (
                  <div
                    key={block.id}
                    data-block-id={block.id}
                    style={{ width: "100%", maxWidth: "100%", overflow: "visible", flexShrink: 0 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: block.align === "center" ? "center" : block.align === "right" ? "flex-end" : "flex-start",
                        width: "100%",
                        maxWidth: "100%",
                        overflow: "visible",
                      }}
                    >
                      {renderBlockInner(block, pageIndex)}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <InsertMenu onInsert={(type) => onAddBlock(type, block.id)} visible={selectedBlockId === block.id} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Positioned blocks (have posX/posY) — rendered absolutely */}
              {pageBlocks.filter((b) => b.posX != null || b.posY != null).map((block) => (
                <div
                  key={block.id}
                  data-block-id={block.id}
                  style={{
                    position: "absolute",
                    left: block.posX ?? 0,
                    top: block.posY ?? 0,
                    maxWidth: "100%",
                    overflow: "visible",
                    zIndex: selectedBlockId === block.id ? 10 : 5,
                  }}
                >
                  {renderBlockInner(block, pageIndex)}
                </div>
              ))}
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
