import { useRef } from "react";
import type { Block } from "@/lib/blocks";
import type { Template } from "@/lib/templates";

interface Props {
  block: Block;
  template: Template;
  onUpdate: (updates: Partial<Block>) => void;
  isSelected: boolean;
}

export function BlockRenderer({ block, template, onUpdate, isSelected }: Props) {
  const editRef = useRef<HTMLDivElement>(null);

  const handleBlur = () => {
    if (editRef.current && (block.type === "heading" || block.type === "text")) {
      onUpdate({ content: editRef.current.innerText });
    }
  };

  if (block.type === "heading") {
    const Tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
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
    return (
      <div
        ref={editRef}
        contentEditable={isSelected}
        suppressContentEditableWarning
        onBlur={handleBlur}
        style={{
          fontFamily: template.bodyFont,
          fontSize: "1em",
          color: template.colors.text,
          outline: "none",
          cursor: isSelected ? "text" : "pointer",
          whiteSpace: "pre-wrap",
        }}
      >
        {block.content}
      </div>
    );
  }

  if (block.type === "image") {
    if (!block.url) {
      return (
        <div
          className="border-2 border-dashed rounded-lg flex items-center justify-center py-10"
          style={{ borderColor: template.colors.accent, color: template.colors.accent }}
        >
          <span className="text-sm">Wybierz obraz w panelu ustawień →</span>
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
