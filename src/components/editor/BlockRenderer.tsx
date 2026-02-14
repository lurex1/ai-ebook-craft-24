import { useRef, useMemo } from "react";
import { marked } from "marked";
import type { Block } from "@/lib/blocks";
import type { Template } from "@/lib/templates";

interface Props {
  block: Block;
  template: Template;
  onUpdate: (updates: Partial<Block>) => void;
  isSelected: boolean;
  onGenerateImage?: (contextText: string) => void;
}

// Configure marked for clean output
marked.setOptions({
  breaks: true,
  gfm: true,
});

function renderMarkdown(text: string): string {
  // Strip top-level headings that AI sometimes adds (### Title)
  const cleaned = text.replace(/^#{1,3}\s+.*$/gm, (match) => {
    // Keep the text but remove the markdown heading markers
    return `<strong>${match.replace(/^#{1,3}\s+/, "")}</strong>`;
  });
  return marked.parse(cleaned) as string;
}

export function BlockRenderer({ block, template, onUpdate, isSelected, onGenerateImage }: Props) {
  const editRef = useRef<HTMLDivElement>(null);

  const handleBlur = () => {
    if (editRef.current && (block.type === "heading" || block.type === "text")) {
      onUpdate({ content: editRef.current.innerText });
    }
  };

  const renderedHtml = useMemo(() => {
    if (block.type === "text" && block.content) {
      return renderMarkdown(block.content);
    }
    return "";
  }, [block.type, block.content]);

  if (block.type === "heading") {
    const sizes: Record<number, string> = { 1: "2.2em", 2: "1.6em", 3: "1.3em" };
    return (
      <div
        ref={editRef}
        contentEditable={isSelected}
        suppressContentEditableWarning
        onBlur={handleBlur}
        style={{
          fontFamily: template.headingFont,
          fontSize: sizes[block.level || 2],
          fontWeight: 700,
          color: template.colors.heading,
          outline: "none",
          cursor: isSelected ? "text" : "pointer",
          lineHeight: 1.3,
          paddingBottom: 4,
        }}
      >
        {block.content}
      </div>
    );
  }

  if (block.type === "text") {
    if (isSelected) {
      return (
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          style={{
            fontFamily: template.bodyFont,
            fontSize: "1em",
            color: template.colors.text,
            outline: "none",
            cursor: "text",
            whiteSpace: "pre-wrap",
          }}
        >
          {block.content}
        </div>
      );
    }

    return (
      <div
        className="prose-ebook"
        style={{
          fontFamily: template.bodyFont,
          fontSize: "1em",
          color: template.colors.text,
          cursor: "pointer",
        }}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  if (block.type === "image") {
    if (!block.url) {
      return (
        <div
          className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center py-8 gap-3"
          style={{ borderColor: template.colors.accent, color: template.colors.accent }}
        >
          <span className="text-sm">Wybierz obraz w panelu ustawień →</span>
          {onGenerateImage && (
            <button
              onClick={() => onGenerateImage("")}
              className="text-xs px-3 py-1.5 rounded-md transition-colors"
              style={{ backgroundColor: template.colors.accent, color: template.colors.bg }}
            >
              ✨ Generuj grafikę AI
            </button>
          )}
        </div>
      );
    }
    return (
      <div style={{ width: `${block.width || 100}%` }}>
        <img
          src={block.url}
          alt={block.alt || ""}
          className="max-w-full rounded"
          style={{ display: "block" }}
        />
      </div>
    );
  }

  if (block.type === "spacer") {
    return (
      <div
        style={{ height: block.height || 40 }}
        className={isSelected ? "border border-dashed rounded" : ""}
      />
    );
  }

  if (block.type === "chapter-break") {
    return (
      <div className="flex items-center gap-3 py-4">
        <div className="flex-1 border-t-2" style={{ borderColor: template.colors.accent }} />
        <span className="text-xs uppercase tracking-widest" style={{ color: template.colors.accent }}>
          Nowa strona
        </span>
        <div className="flex-1 border-t-2" style={{ borderColor: template.colors.accent }} />
      </div>
    );
  }

  return null;
}
