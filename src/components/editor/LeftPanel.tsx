import { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChapterData } from "@/lib/blocks";

interface Props {
  chapters: ChapterData[];
  selectedChapterId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}

export function LeftPanel({ chapters, selectedChapterId, onSelect, onAdd, onDelete, onRename, onMove }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditValue(title);
  };

  const saveEdit = (id: string) => {
    onRename(id, editValue);
    setEditingId(null);
  };

  return (
    <div className="w-[240px] border-r border-border/50 bg-card flex flex-col shrink-0">
      <div className="px-3 py-3 border-b border-border/30 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rozdziały</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chapters.map((ch, idx) => (
          <div
            key={ch.id}
            className={`group rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
              selectedChapterId === ch.id
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-secondary border border-transparent"
            }`}
            onClick={() => onSelect(ch.id)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}.</span>
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
                <span className="text-sm text-foreground flex-1 truncate">{ch.title}</span>
              )}
            </div>
            {selectedChapterId === ch.id && editingId !== ch.id && (
              <div className="flex gap-1 mt-2 ml-5">
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
        ))}
      </div>
    </div>
  );
}
