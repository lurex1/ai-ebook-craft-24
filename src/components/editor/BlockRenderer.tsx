import { useRef, useMemo, useCallback } from "react";
import type { Block } from "@/lib/blocks";
import type { Template } from "@/lib/templates";
import { TextSelectionToolbar } from "./TextSelectionToolbar";
import { cleanMarkdownToHtml } from "@/lib/blockUtils";

function renderContent(text: string): string {
  if (text.includes("<") && text.includes(">")) {
    return cleanMarkdownToHtml(text);
  }
  return cleanMarkdownToHtml(text);
}

interface Props {
  block: Block;
  template: Template;
  onUpdate: (updates: Partial<Block>) => void;
  isSelected: boolean;
  onGenerateImage?: (contextText: string) => void;
  onReplaceSelection?: (newHtml: string) => void;
}

export function BlockRenderer({ block, template, onUpdate, isSelected, onGenerateImage, onReplaceSelection }: Props) {
  const editRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(() => {
    if (editRef.current && (block.type === "heading" || block.type === "text")) {
      onUpdate({ content: editRef.current.innerHTML });
    }
  }, [block.type, onUpdate]);

  const replaceSelectedContent = useCallback(
    (newHtml: string) => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !editRef.current) return;
      try {
        const range = sel.getRangeAt(0);
        if (!editRef.current.contains(range.commonAncestorContainer)) return;
        range.deleteContents();
        const temp = document.createElement("div");
        temp.innerHTML = newHtml;
        const frag = document.createDocumentFragment();
        while (temp.firstChild) frag.appendChild(temp.firstChild);
        range.insertNode(frag);
        sel.removeAllRanges();
        onUpdate({ content: editRef.current.innerHTML });
      } catch {
        // fallback
      }
    },
    [onUpdate],
  );

  const renderedHtml = useMemo(() => {
    if (block.type === "text" && block.content) {
      return renderContent(block.content);
    }
    return "";
  }, [block.type, block.content]);

  const headingHtml = useMemo(() => {
    if (block.type === "heading" && block.content) {
      if (block.content.includes("<") && block.content.includes(">")) {
        return block.content;
      }
      return block.content.replace(/^#{1,3}\s+/, "");
    }
    return block.content || "";
  }, [block.type, block.content]);

  // ── SHARED overflow-safe styles ──────────────────────────────
  const overflowSafeStyle: React.CSSProperties = {
    wordBreak: "break-word",
    overflowWrap: "break-word",
    hyphens: "auto",
    maxWidth: "100%",
    overflow: "hidden",
  };

  if (block.type === "heading") {
    const sizes: Record<number, string> = { 1: "2.2em", 2: "1.6em", 3: "1.3em" };
    return (
      <div ref={containerRef} className="relative" style={{ maxWidth: "100%", overflow: "hidden" }}>
        <div
          ref={editRef}
          contentEditable={isSelected}
          suppressContentEditableWarning
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: headingHtml }}
          style={{
            ...overflowSafeStyle,
            fontFamily: template.headingFont,
            fontSize: sizes[block.level || 2],
            fontWeight: 700,
            color: block.textColor || template.colors.heading,
            backgroundColor: block.bgColor && block.bgColor !== "transparent" ? block.bgColor : undefined,
            outline: "none",
            cursor: isSelected ? "text" : "pointer",
            lineHeight: 1.3,
            paddingBottom: 4,
            borderRadius: block.bgColor ? 4 : undefined,
            padding: block.bgColor && block.bgColor !== "transparent" ? "4px 8px" : undefined,
          }}
        />
        {isSelected && onGenerateImage && (
          <TextSelectionToolbar
            containerRef={containerRef as React.RefObject<HTMLElement>}
            onApplyInlineStyle={(style, value) => applyInlineStyle(style, value)}
            onGenerateImage={(text) => onGenerateImage(text)}
            onReplaceSelection={onReplaceSelection || replaceSelectedContent}
          />
        )}
      </div>
    );
  }

  if (block.type === "text") {
    return (
      <div ref={containerRef} className="relative" style={{ maxWidth: "100%", overflow: "hidden" }}>
        <div
          ref={editRef}
          contentEditable={isSelected}
          suppressContentEditableWarning
          onInput={handleInput}
          className="prose-ebook"
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
          style={{
            ...overflowSafeStyle,
            fontFamily: template.bodyFont,
            fontSize: "1em",
            color: block.textColor || template.colors.text,
            backgroundColor: block.bgColor && block.bgColor !== "transparent" ? block.bgColor : undefined,
            outline: "none",
            cursor: isSelected ? "text" : "pointer",
            borderRadius: block.bgColor ? 4 : undefined,
            padding: block.bgColor && block.bgColor !== "transparent" ? "8px 12px" : undefined,
          }}
        />
        {isSelected && onGenerateImage && (
          <TextSelectionToolbar
            containerRef={containerRef as React.RefObject<HTMLElement>}
            onApplyInlineStyle={(style, value) => applyInlineStyle(style, value)}
            onGenerateImage={(text) => onGenerateImage(text)}
            onReplaceSelection={onReplaceSelection || replaceSelectedContent}
          />
        )}
      </div>
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
      <div style={{ width: `${block.width || 100}%`, maxWidth: "100%", overflow: "hidden" }}>
        <img
          src={block.url}
          alt={block.alt || ""}
          className="max-w-full rounded"
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
        />
      </div>
    );
  }

  if (block.type === "spacer") {
    return <div style={{ height: block.height || 40 }} className={isSelected ? "border border-dashed rounded" : ""} />;
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

function applyInlineStyle(style: "color" | "backgroundColor", value: string) {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  span.style[style] = value;
  try {
    range.surroundContents(span);
    sel.removeAllRanges();
  } catch {
    if (style === "color") {
      document.execCommand("foreColor", false, value);
    } else {
      document.execCommand("hiliteColor", false, value === "transparent" ? "transparent" : value);
    }
  }
}
