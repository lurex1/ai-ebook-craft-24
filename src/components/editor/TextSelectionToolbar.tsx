import { useState, useEffect, useRef } from "react";
import { Palette, Paintbrush, Sparkles } from "lucide-react";

interface Props {
  containerRef: React.RefObject<HTMLElement>;
  onApplyInlineStyle: (style: "color" | "backgroundColor", value: string) => void;
  onGenerateImage: (selectedText: string) => void;
}

const TEXT_COLORS = [
  "#1a1a1a", "#2c3e50", "#8b4513", "#1a5276", "#4a7c59",
  "#c0392b", "#7b2d8e", "#d4760a", "#2471a3", "#117a65",
];

const BG_COLORS = [
  "transparent", "#fff9c4", "#ffe0b2", "#f8bbd0", "#c8e6c9",
  "#bbdefb", "#d1c4e9", "#f0f4c3", "#ffccbc", "#b2dfdb",
];

export function TextSelectionToolbar({ containerRef, onApplyInlineStyle, onGenerateImage }: Props) {
  const [showTextColors, setShowTextColors] = useState(false);
  const [showBgColors, setShowBgColors] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
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
      setPosition({
        top: rect.top - containerRect.top - 44,
        left: rect.left - containerRect.left + rect.width / 2,
      });
      setVisible(true);
    };

    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [containerRef]);

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50 flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg border"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateX(-50%)",
        backgroundColor: "white",
        borderColor: "#e0e0e0",
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Text color - applies to selected word */}
      <div className="relative">
        <button
          onClick={() => { setShowTextColors(!showTextColors); setShowBgColors(false); }}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          title="Kolor tekstu (zaznaczenie)"
        >
          <Palette className="h-3.5 w-3.5" style={{ color: "#1a1a1a" }} />
        </button>
        {showTextColors && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 grid grid-cols-5 gap-1 min-w-[140px]">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { onApplyInlineStyle("color", c); setShowTextColors(false); }}
                className="h-6 w-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Background color - applies to selected word */}
      <div className="relative">
        <button
          onClick={() => { setShowBgColors(!showBgColors); setShowTextColors(false); }}
          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
          title="Podświetlenie (zaznaczenie)"
        >
          <Paintbrush className="h-3.5 w-3.5" style={{ color: "#999" }} />
        </button>
        {showBgColors && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-lg shadow-lg border border-gray-200 grid grid-cols-5 gap-1 min-w-[140px]">
            {BG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { onApplyInlineStyle("backgroundColor", c); setShowBgColors(false); }}
                className="h-6 w-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: c === "transparent" ? "white" : c }}
              >
                {c === "transparent" && <span className="text-[8px] text-gray-400">✕</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Generate image from selection */}
      <button
        onClick={() => { onGenerateImage(selectedText); setVisible(false); }}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
        title="Generuj grafikę AI z zaznaczenia"
      >
        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
        <span className="text-[10px] text-gray-600 whitespace-nowrap">Grafika AI</span>
      </button>
    </div>
  );
}
