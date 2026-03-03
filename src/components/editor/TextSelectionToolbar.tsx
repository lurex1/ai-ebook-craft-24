import { useState, useEffect, useRef } from "react";
import { Palette, Paintbrush, Sparkles, Table, List, Replace, Brain, Loader2, ChevronDown, SplitSquareHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  containerRef: React.RefObject<HTMLElement>;
  onApplyInlineStyle: (style: "color" | "backgroundColor", value: string) => void;
  onGenerateImage: (selectedText: string) => void;
  onReplaceSelection?: (newHtml: string) => void;
  onExtractToBlock?: (html: string) => void;
}

const TEXT_COLORS = [
  "#1a1a1a", "#2c3e50", "#8b4513", "#1a5276", "#4a7c59",
  "#c0392b", "#7b2d8e", "#d4760a", "#2471a3", "#117a65",
];

const BG_COLORS = [
  "transparent", "#fff9c4", "#ffe0b2", "#f8bbd0", "#c8e6c9",
  "#bbdefb", "#d1c4e9", "#f0f4c3", "#ffccbc", "#b2dfdb",
];

type SubMenu = "textColor" | "bgColor" | "replace" | "ai" | null;

export function TextSelectionToolbar({ containerRef, onApplyInlineStyle, onGenerateImage, onReplaceSelection, onExtractToBlock }: Props) {
  const [subMenu, setSubMenu] = useState<SubMenu>(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectedHtml, setSelectedHtml] = useState("");
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [replaceText, setReplaceText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !containerRef.current) {
        setTimeout(() => {
          const sel2 = window.getSelection();
          if (!sel2 || sel2.isCollapsed) setVisible(false);
        }, 200);
        return;
      }

      const range = sel.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) return;

      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      setSelectedText(sel.toString());
      // Capture selected HTML
      const div = document.createElement("div");
      div.appendChild(range.cloneContents());
      setSelectedHtml(div.innerHTML);

      setPosition({
        top: rect.top - containerRect.top - 44,
        left: rect.left - containerRect.left + rect.width / 2,
      });
      setVisible(true);
    };

    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [containerRef]);

  const handleReplaceWithText = () => {
    if (!replaceText.trim() || !onReplaceSelection) return;
    onReplaceSelection(replaceText);
    setReplaceText("");
    setSubMenu(null);
    setVisible(false);
  };

  const handleAiTransform = async (transformType: string) => {
    if (!selectedHtml && !selectedText) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ebook", {
        body: {
          action: "transform-text",
          selectedText: selectedHtml || selectedText,
          transformType,
        },
      });
      if (error) {
        // Try to parse error body for user-friendly message
        try {
          const ctx = error?.context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) {
              const { toast } = await import("@/hooks/use-toast");
              toast({ title: "Błąd AI", description: body.error, variant: "destructive" });
              return;
            }
          }
        } catch {}
        const { toast } = await import("@/hooks/use-toast");
        toast({ title: "Błąd AI", description: "Nie udało się przetworzyć tekstu. Sprawdź kredyty AI w Settings → Workspace → Usage.", variant: "destructive" });
        return;
      }
      if (data?.transformedText && onReplaceSelection) {
        onReplaceSelection(data.transformedText);
        setSubMenu(null);
        setVisible(false);
      }
    } catch (err: any) {
      console.error("AI transform error:", err);
      const { toast } = await import("@/hooks/use-toast");
      toast({ title: "Błąd", description: "Wystąpił nieoczekiwany błąd.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  if (!visible) return null;

  const toggleMenu = (menu: SubMenu) => setSubMenu(subMenu === menu ? null : menu);

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 flex flex-col items-center gap-0"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Main toolbar row */}
      <div
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-lg border"
        style={{ backgroundColor: "white", borderColor: "#e0e0e0" }}
      >
        {/* Text color */}
        <button
          onClick={() => toggleMenu("textColor")}
          className={`p-1.5 rounded transition-colors ${subMenu === "textColor" ? "bg-gray-200" : "hover:bg-gray-100"}`}
          title="Kolor tekstu"
        >
          <Palette className="h-3.5 w-3.5" style={{ color: "#1a1a1a" }} />
        </button>

        {/* Background color */}
        <button
          onClick={() => toggleMenu("bgColor")}
          className={`p-1.5 rounded transition-colors ${subMenu === "bgColor" ? "bg-gray-200" : "hover:bg-gray-100"}`}
          title="Podświetlenie"
        >
          <Paintbrush className="h-3.5 w-3.5" style={{ color: "#999" }} />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Replace text */}
        <button
          onClick={() => toggleMenu("replace")}
          className={`p-1.5 rounded transition-colors ${subMenu === "replace" ? "bg-gray-200" : "hover:bg-gray-100"}`}
          title="Zastąp tekst"
        >
          <Replace className="h-3.5 w-3.5 text-blue-600" />
        </button>

        {/* AI transforms */}
        <button
          onClick={() => toggleMenu("ai")}
          className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${subMenu === "ai" ? "bg-gray-200" : "hover:bg-gray-100"}`}
          title="Transformacje AI"
        >
          <Brain className="h-3.5 w-3.5 text-purple-600" />
          <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Extract to block */}
        {onExtractToBlock && (
          <button
            onClick={() => {
              onExtractToBlock(selectedHtml || selectedText);
              setVisible(false);
            }}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
            title="Wyciągnij do osobnego bloku"
          >
            <SplitSquareHorizontal className="h-3.5 w-3.5 text-teal-600" />
            <span className="text-[10px] text-gray-600 whitespace-nowrap">Blok</span>
          </button>
        )}

        {/* Generate image */}
        <button
          onClick={() => { onGenerateImage(selectedText); setVisible(false); }}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
          title="Generuj grafikę AI"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-[10px] text-gray-600 whitespace-nowrap">Grafika</span>
        </button>
      </div>

      {/* Submenus */}
      {subMenu === "textColor" && (
        <div className="mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 grid grid-cols-5 gap-1 min-w-[140px]">
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { onApplyInlineStyle("color", c); setSubMenu(null); }}
              className="h-6 w-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {subMenu === "bgColor" && (
        <div className="mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 grid grid-cols-5 gap-1 min-w-[140px]">
          {BG_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { onApplyInlineStyle("backgroundColor", c); setSubMenu(null); }}
              className="h-6 w-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: c === "transparent" ? "white" : c }}
            >
              {c === "transparent" && <span className="text-[8px] text-gray-400">✕</span>}
            </button>
          ))}
        </div>
      )}

      {subMenu === "replace" && (
        <div className="mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[220px]">
          <p className="text-[10px] text-gray-500 mb-1.5">Zastąp zaznaczony tekst:</p>
          <textarea
            className="w-full text-xs border border-gray-200 rounded p-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
            rows={3}
            placeholder="Wpisz nowy tekst..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReplaceWithText(); } }}
          />
          <button
            onClick={handleReplaceWithText}
            disabled={!replaceText.trim()}
            className="mt-1.5 w-full text-xs py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Zastąp
          </button>
        </div>
      )}

      {subMenu === "ai" && (
        <div className="mt-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px] overflow-hidden">
          {aiLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 px-3">
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span className="text-xs text-gray-600">Przetwarzam AI...</span>
            </div>
          ) : (
            <>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">Konwertuj</p>
              <button onClick={() => handleAiTransform("to-table")} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <Table className="h-3.5 w-3.5 text-green-600" /> Zamień na tabelę
              </button>
              <button onClick={() => handleAiTransform("to-bullets")} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <List className="h-3.5 w-3.5 text-blue-600" /> Zamień na wypunktowanie
              </button>
              <div className="border-t border-gray-100 my-1" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider px-3 pt-1 pb-1">Poziom trudności</p>
              <button onClick={() => handleAiTransform("simplify")} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <span className="w-3.5 h-3.5 rounded-full bg-green-100 text-green-700 text-[9px] flex items-center justify-center font-bold">P</span> Wersja prosta
              </button>
              <button onClick={() => handleAiTransform("medium")} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-100 text-amber-700 text-[9px] flex items-center justify-center font-bold">M</span> Wersja średnia
              </button>
              <button onClick={() => handleAiTransform("advanced")} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 pb-2 transition-colors">
                <span className="w-3.5 h-3.5 rounded-full bg-red-100 text-red-700 text-[9px] flex items-center justify-center font-bold">Z</span> Wersja zaawansowana
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
