export interface Template {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  colors: {
    bg: string;
    text: string;
    primary: string;
    accent: string;
    muted: string;
    heading: string;
  };
  spacing: {
    margin: number;
    lineHeight: number;
    paragraphGap: number;
  };
}

export const TEMPLATES: Record<string, Template> = {
  modern: {
    id: "modern",
    name: "Modern",
    description: "Elegancki i nowoczesny",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    colors: { bg: "#ffffff", text: "#1a1a2e", primary: "#d4a437", accent: "#e8c468", muted: "#f8f6f0", heading: "#1a1a2e" },
    spacing: { margin: 60, lineHeight: 1.8, paragraphGap: 16 },
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Czysto i prosto",
    headingFont: "'Helvetica Neue', Arial, sans-serif",
    bodyFont: "'Georgia', serif",
    colors: { bg: "#fafafa", text: "#333333", primary: "#111111", accent: "#888888", muted: "#f0f0f0", heading: "#000000" },
    spacing: { margin: 80, lineHeight: 2, paragraphGap: 20 },
  },
  dark: {
    id: "dark",
    name: "Dark",
    description: "Ciemny i nowoczesny",
    headingFont: "'Source Sans 3', sans-serif",
    bodyFont: "'Source Sans 3', sans-serif",
    colors: { bg: "#1a1a2e", text: "#e0e0e0", primary: "#4fc3f7", accent: "#81d4fa", muted: "#252540", heading: "#ffffff" },
    spacing: { margin: 60, lineHeight: 1.8, paragraphGap: 16 },
  },
  business: {
    id: "business",
    name: "Business",
    description: "Profesjonalny i korporacyjny",
    headingFont: "'Georgia', serif",
    bodyFont: "'Arial', sans-serif",
    colors: { bg: "#ffffff", text: "#2c3e50", primary: "#2980b9", accent: "#3498db", muted: "#ecf0f1", heading: "#1a252f" },
    spacing: { margin: 65, lineHeight: 1.7, paragraphGap: 14 },
  },
  tech: {
    id: "tech",
    name: "Tech",
    description: "Technologiczny i futurystyczny",
    headingFont: "'Source Sans 3', sans-serif",
    bodyFont: "'Source Sans 3', sans-serif",
    colors: { bg: "#0d1117", text: "#c9d1d9", primary: "#58a6ff", accent: "#1f6feb", muted: "#161b22", heading: "#f0f6fc" },
    spacing: { margin: 55, lineHeight: 1.75, paragraphGap: 16 },
  },
  fantasy: {
    id: "fantasy",
    name: "Fantasy",
    description: "Bogaty i dekoracyjny",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Georgia', serif",
    colors: { bg: "#fdf6e3", text: "#3c2415", primary: "#8b4513", accent: "#cd853f", muted: "#f5ecd7", heading: "#2c1810" },
    spacing: { margin: 70, lineHeight: 1.9, paragraphGap: 18 },
  },
};

export const PAGE_SIZES: Record<string, { width: number; height: number; label: string }> = {
  A4: { width: 210, height: 297, label: "A4 (210×297mm)" },
  A5: { width: 148, height: 210, label: "A5 (148×210mm)" },
  "US Letter": { width: 216, height: 279, label: "US Letter (216×279mm)" },
  Kindle: { width: 127, height: 203, label: "Kindle (127×203mm)" },
  Custom: { width: 200, height: 280, label: "Niestandardowy" },
};
