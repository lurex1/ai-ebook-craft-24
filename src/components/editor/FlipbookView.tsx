import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Block, ChapterData } from "@/lib/blocks";
import type { Template } from "@/lib/templates";
import { BlockRenderer } from "./BlockRenderer";
import { PAGE_SIZES } from "@/lib/templates";

const MM_TO_PX = 96 / 25.4;

interface Props {
  chapters: ChapterData[];
  template: Template;
  pageSize: string;
  onClose: () => void;
  watermarkText?: string;
  footerConfig?: Record<string, any>;
}

function estimateBlockHeight(block: Block, template: Template, contentWidth: number): number {
  if (block.type === "spacer") return block.height || 40;
  if (block.type === "chapter-break") return 0;
  if (block.type === "image") {
    const imgWidth = ((block.width || 100) / 100) * contentWidth;
    return imgWidth * 0.6 + 8;
  }
  if (block.type === "heading") {
    const sizes: Record<number, number> = { 1: 36, 2: 26, 3: 21 };
    const fontSize = sizes[block.level || 2] || 26;
    const text = (block.content || "").replace(/<[^>]*>/g, "");
    const charsPerLine = Math.floor(contentWidth / (fontSize * 0.55));
    const lines = Math.max(1, Math.ceil(text.length / Math.max(charsPerLine, 1)));
    return lines * fontSize * 1.3 + template.spacing.paragraphGap + 4;
  }
  if (block.type === "text") {
    const text = block.content || "";
    const plainText = text.replace(/<[^>]*>/g, "");
    const fontSize = 16;
    const charsPerLine = Math.floor(contentWidth / (fontSize * 0.5));
    const lines = Math.max(1, Math.ceil(plainText.length / Math.max(charsPerLine, 1)));
    const extraElements = (text.match(/<\/li>/g) || []).length * 4;
    const blockquotes = (text.match(/<blockquote>/g) || []).length * 12;
    const tables = (text.match(/<table>/g) || []).length * 60;
    return lines * fontSize * template.spacing.lineHeight + template.spacing.paragraphGap + extraElements + blockquotes + tables;
  }
  return 40;
}

export function FlipbookView({ chapters, template, pageSize, onClose, watermarkText, footerConfig }: Props) {
  const [currentPage, setCurrentPage] = useState(0);

  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.A4;
  const scale = 0.85;
  const pageWidthPx = size.width * MM_TO_PX * scale;
  const pageHeightPx = size.height * MM_TO_PX * scale;
  const marginPx = template.spacing.margin * scale;
  const contentWidth = pageWidthPx - marginPx * 2;
  const showPageNumbers = footerConfig?.showPageNumbers ?? true;
  const footerHeight = 28;
  const usableHeight = pageHeightPx - marginPx * 2 - (showPageNumbers ? footerHeight : 0);

  const allPages = useMemo(() => {
    const pages: { blocks: Block[]; chapterTitle: string }[] = [];

    for (const chapter of chapters) {
      let currentBlocks: Block[] = [];
      let currentHeight = 0;

      for (const block of chapter.blocks) {
        if (block.type === "chapter-break") {
          if (currentBlocks.length > 0) {
            pages.push({ blocks: currentBlocks, chapterTitle: chapter.title });
          }
          currentBlocks = [];
          currentHeight = 0;
          continue;
        }

        const blockH = estimateBlockHeight(block, template, contentWidth);

        if (currentHeight + blockH > usableHeight && currentBlocks.length > 0) {
          pages.push({ blocks: currentBlocks, chapterTitle: chapter.title });
          currentBlocks = [];
          currentHeight = 0;
        }

        currentBlocks.push(block);
        currentHeight += blockH;
      }

      if (currentBlocks.length > 0) {
        pages.push({ blocks: currentBlocks, chapterTitle: chapter.title });
      }
    }

    return pages;
  }, [chapters, template, contentWidth, usableHeight]);

  const totalPages = allPages.length;
  const page = allPages[currentPage];

  const goLeft = () => setCurrentPage((p) => Math.max(0, p - 1));
  const goRight = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-white/70">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm">Podgląd flipbook</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">
            Strona {currentPage + 1} z {totalPages}
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white/70 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Page */}
      <div className="flex items-center gap-8">
        <button
          onClick={goLeft}
          disabled={currentPage === 0}
          className="p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          className="relative transition-transform duration-500 ease-in-out"
          style={{
            width: pageWidthPx,
            height: pageHeightPx,
            backgroundColor: template.colors.bg,
            boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)",
            borderRadius: 4,
            fontFamily: template.bodyFont,
            color: template.colors.text,
            lineHeight: template.spacing.lineHeight,
            perspective: "1000px",
          }}
        >
          {page && (
            <div style={{ padding: marginPx, minHeight: pageHeightPx - (showPageNumbers ? footerHeight : 0) }}>
              {page.blocks.map((block) => (
                <div key={block.id} style={{ marginBottom: 2, padding: "2px 4px" }}>
                  <BlockRenderer
                    block={block}
                    template={template}
                    onUpdate={() => {}}
                    isSelected={false}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Watermark */}
          {watermarkText && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
              style={{
                fontSize: "2em",
                color: "rgba(0,0,0,0.06)",
                fontFamily: template.bodyFont,
                transform: "rotate(-30deg)",
                whiteSpace: "nowrap",
                letterSpacing: "0.1em",
              }}
            >
              {watermarkText}
            </div>
          )}

          {/* Page number */}
          {showPageNumbers && (
            <div
              className="absolute bottom-0 left-0 right-0 text-center text-[10px] opacity-40"
              style={{ padding: 6, fontFamily: template.bodyFont, color: template.colors.text }}
            >
              {currentPage + 1}
            </div>
          )}
        </div>

        <button
          onClick={goRight}
          disabled={currentPage >= totalPages - 1}
          className="p-3 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Page indicator dots */}
      <div className="mt-6 flex items-center gap-1 max-w-md overflow-x-auto">
        {Array.from({ length: Math.min(totalPages, 30) }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === currentPage ? "w-6 bg-white/80" : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
        {totalPages > 30 && <span className="text-white/40 text-xs ml-1">+{totalPages - 30}</span>}
      </div>
    </div>
  );
}
