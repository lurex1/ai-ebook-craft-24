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
    colors: { bg: "#ffffff", text: "#2c2c2c", primary: "#c8956c", accent: "#d4a98a", muted: "#faf7f4", heading: "#1a1a1a" },
    spacing: { margin: 60, lineHeight: 1.8, paragraphGap: 16 },
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Czysto i prosto",
    headingFont: "'Helvetica Neue', Arial, sans-serif",
    bodyFont: "'Georgia', serif",
    colors: { bg: "#fefefe", text: "#3a3a3a", primary: "#555555", accent: "#999999", muted: "#f5f5f5", heading: "#111111" },
    spacing: { margin: 80, lineHeight: 2, paragraphGap: 20 },
  },
  warm: {
    id: "warm",
    name: "Warm",
    description: "Ciepły i przyjazny",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    colors: { bg: "#fdf8f0", text: "#3c2f1e", primary: "#b5763c", accent: "#d4a06a", muted: "#f5ede0", heading: "#2a1f10" },
    spacing: { margin: 60, lineHeight: 1.85, paragraphGap: 16 },
  },
  business: {
    id: "business",
    name: "Business",
    description: "Profesjonalny i korporacyjny",
    headingFont: "'Georgia', serif",
    bodyFont: "'Arial', sans-serif",
    colors: { bg: "#ffffff", text: "#2c3e50", primary: "#1a5276", accent: "#2980b9", muted: "#f0f4f8", heading: "#1a252f" },
    spacing: { margin: 65, lineHeight: 1.7, paragraphGap: 14 },
  },
  nature: {
    id: "nature",
    name: "Nature",
    description: "Naturalny i spokojny",
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    colors: { bg: "#f8faf6", text: "#2d3a2d", primary: "#4a7c59", accent: "#7aad8b", muted: "#eef3eb", heading: "#1e2b1e" },
    spacing: { margin: 60, lineHeight: 1.8, paragraphGap: 16 },
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
