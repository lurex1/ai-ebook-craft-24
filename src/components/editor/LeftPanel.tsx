import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil, Check, ChevronRight, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChapterData } from "@/lib/blocks";

interface Props {
  chapters: ChapterData[];
  selectedChapterId: string | null;
  onSelect: (id: string) => void;
  onScrollToBlock?: (chapterId: string, blockId: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}

export function LeftPanel({ chapters, selectedChapterId, onSelect, onScrollToBlock, onAdd, onDelete, onRename, onMove }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const startEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditValue(title);
  };

  const saveEdit = (id: string) => {
    onRename(id, editValue);
    setEditingId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Extract sub-items (headings) from chapter blocks
  const getChapterSubItems = (ch: ChapterData) => {
    return ch.blocks
      .filter((b) => b.type === "heading" && (b.level === 2 || b.level === 3))
      .map((b) => ({
        id: b.id,
        title: b.content || "Bez tytułu",
        level: b.level || 2,
        type: "heading" as const,
      }));
  };

  // Count images in chapter
  const getImageCount = (ch: ChapterData) => {
    return ch.blocks.filter((b) => b.type === "image").length;
  };

  return (
    <div className="w-[260px] border-r border-border/50 bg-card flex flex-col shrink-0">
      <div className="px-3 py-3 border-b border-border/30 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Spis treści</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {chapters.map((ch, idx) => {
          const subItems = getChapterSubItems(ch);
          const imageCount = getImageCount(ch);
          const isExpanded = expandedIds.has(ch.id);
          const isSelected = selectedChapterId === ch.id;
          const hasSubItems = subItems.length > 0;

          return (
            <div key={ch.id}>
              {/* Chapter row */}
              <div
                className={`group rounded-lg px-2 py-2 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-secondary border border-transparent"
                }`}
                onClick={() => {
                  onSelect(ch.id);
                  if (hasSubItems && !isExpanded) toggleExpand(ch.id);
                }}
              >
                <div className="flex items-center gap-1.5">
                  {hasSubItems ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpand(ch.id); }}
                      className="p-0.5 text-muted-foreground hover:text-foreground transition-transform"
                    >
                      <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                  ) : (
                    <span className="w-4" />
                  )}
                  <span className="text-xs text-primary font-mono font-bold w-5 shrink-0">{idx + 1}.</span>
                  {editingId === ch.id ? (
                    <div className="flex gap-1 flex-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-6 text-xs bg-secondary border-border"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(ch.id)}
                      />
                      <button onClick={() => saveEdit(ch.id)} className="text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-foreground flex-1 truncate font-medium">{ch.title}</span>
                  )}
                </div>

                {/* Stats row */}
                {!editingId && (
                  <div className="flex items-center gap-2 ml-[2.25rem] mt-1">
                    {subItems.length > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <FileText className="h-2.5 w-2.5" /> {subItems.length} pkt
                      </span>
                    )}
                    {imageCount > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <ImageIcon className="h-2.5 w-2.5" /> {imageCount}
                      </span>
                    )}
                  </div>
                )}

                {/* Chapter controls */}
                {isSelected && editingId !== ch.id && (
                  <div className="flex gap-1 mt-1.5 ml-[2.25rem]">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(ch.id, ch.title); }} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onMove(ch.id, -1); }} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" disabled={idx === 0}>
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onMove(ch.id, 1); }} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground" disabled={idx === chapters.length - 1}>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(ch.id); }} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Sub-items (points) */}
              {isExpanded && subItems.length > 0 && (
                <div className="ml-6 border-l border-border/40 pl-2 py-0.5">
                  {subItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 cursor-pointer transition-colors"
                      style={{ paddingLeft: item.level === 3 ? "1.25rem" : undefined }}
                      onClick={() => {
                        onSelect(ch.id);
                        onScrollToBlock?.(ch.id, item.id);
                      }}
                    >
                      <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
