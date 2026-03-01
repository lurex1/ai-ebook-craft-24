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
  // ── Extended style props ──
  headingTransform: "none" | "uppercase" | "capitalize";
  headingLetterSpacing: string;
  headingWeight: number;
  headingBorderBottom: string | false;
  bodyTextAlign: "left" | "justify";
  blockquoteBorderColor: string;
  dropCapEnabled: boolean;
}

export const FONT_OPTIONS = [
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'DM Serif Display', serif", label: "DM Serif Display" },
  { value: "'Cormorant Garamond', serif", label: "Cormorant Garamond" },
  { value: "'Nunito Sans', sans-serif", label: "Nunito Sans" },
  { value: "'Literata', serif", label: "Literata" },
  { value: "'Crimson Pro', serif", label: "Crimson Pro" },
  { value: "'IBM Plex Sans', sans-serif", label: "IBM Plex Sans" },
  { value: "'IBM Plex Serif', serif", label: "IBM Plex Serif" },
  { value: "'Bitter', serif", label: "Bitter" },
  { value: "'Cabin', sans-serif", label: "Cabin" },
  { value: "'Cinzel', serif", label: "Cinzel" },
  { value: "'EB Garamond', serif", label: "EB Garamond" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Source Sans 3', sans-serif", label: "Source Sans 3" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Merriweather', serif", label: "Merriweather" },
  { value: "'Lora', serif", label: "Lora" },
];

// ────────────────────────────────────────────────────
// 6 RADICALLY DIFFERENT TEMPLATES
// ────────────────────────────────────────────────────

export const TEMPLATES: Record<string, Template> = {
  modern: {
    id: "modern",
    name: "Modern",
    description: "Szwajcarski design — czyste linie, dużo kontrastu",
    headingFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    colors: {
      bg: "#ffffff",
      text: "#1a1a1a",
      primary: "#e63946",
      accent: "#e63946",
      muted: "#f1f1f1",
      heading: "#000000",
    },
    spacing: { margin: 55, lineHeight: 1.65, paragraphGap: 12 },
    headingTransform: "uppercase",
    headingLetterSpacing: "0.12em",
    headingWeight: 800,
    headingBorderBottom: "3px solid #e63946",
    bodyTextAlign: "left",
    blockquoteBorderColor: "#e63946",
    dropCapEnabled: false,
  },

  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Zen — dużo przestrzeni, delikatne detale",
    headingFont: "'Cormorant Garamond', serif",
    bodyFont: "'Nunito Sans', sans-serif",
    colors: {
      bg: "#fafaf8",
      text: "#4a4a4a",
      primary: "#888888",
      accent: "#b0b0b0",
      muted: "#f0f0ee",
      heading: "#2a2a2a",
    },
    spacing: { margin: 85, lineHeight: 2.0, paragraphGap: 24 },
    headingTransform: "none",
    headingLetterSpacing: "0.02em",
    headingWeight: 300,
    headingBorderBottom: false,
    bodyTextAlign: "left",
    blockquoteBorderColor: "#cccccc",
    dropCapEnabled: true,
  },

  warm: {
    id: "warm",
    name: "Warm",
    description: "Książkowy klasyk — ciepły papier, eleganckie szeryfy",
    headingFont: "'Literata', serif",
    bodyFont: "'Crimson Pro', serif",
    colors: {
      bg: "#faf3e8",
      text: "#3b2e1e",
      primary: "#a0522d",
      accent: "#c8845a",
      muted: "#f0e6d4",
      heading: "#2a1a08",
    },
    spacing: { margin: 65, lineHeight: 1.85, paragraphGap: 16 },
    headingTransform: "none",
    headingLetterSpacing: "0.01em",
    headingWeight: 700,
    headingBorderBottom: false,
    bodyTextAlign: "justify",
    blockquoteBorderColor: "#c8845a",
    dropCapEnabled: true,
  },

  business: {
    id: "business",
    name: "Business",
    description: "Korporacyjny raport — ostre krawędzie, techniczny look",
    headingFont: "'IBM Plex Sans', sans-serif",
    bodyFont: "'IBM Plex Serif', serif",
    colors: {
      bg: "#ffffff",
      text: "#333d47",
      primary: "#0f4c81",
      accent: "#1a73b5",
      muted: "#edf2f7",
      heading: "#0d2137",
    },
    spacing: { margin: 60, lineHeight: 1.6, paragraphGap: 10 },
    headingTransform: "uppercase",
    headingLetterSpacing: "0.06em",
    headingWeight: 600,
    headingBorderBottom: "2px solid #0f4c81",
    bodyTextAlign: "justify",
    blockquoteBorderColor: "#1a73b5",
    dropCapEnabled: false,
  },

  nature: {
    id: "nature",
    name: "Nature",
    description: "Organiczny i spokojny — leśna paleta, miękkie kształty",
    headingFont: "'Bitter', serif",
    bodyFont: "'Cabin', sans-serif",
    colors: {
      bg: "#f4f7f0",
      text: "#2d3b2a",
      primary: "#3d7a4a",
      accent: "#6aab5d",
      muted: "#e6ede2",
      heading: "#1a3018",
    },
    spacing: { margin: 60, lineHeight: 1.8, paragraphGap: 18 },
    headingTransform: "none",
    headingLetterSpacing: "0",
    headingWeight: 700,
    headingBorderBottom: false,
    bodyTextAlign: "left",
    blockquoteBorderColor: "#6aab5d",
    dropCapEnabled: false,
  },

  fantasy: {
    id: "fantasy",
    name: "Fantasy",
    description: "Bogaty i królewski — złoto, bordo, ozdobne czcionki",
    headingFont: "'Cinzel', serif",
    bodyFont: "'EB Garamond', serif",
    colors: {
      bg: "#1c1118",
      text: "#d4c5b0",
      primary: "#c9a84c",
      accent: "#c9a84c",
      muted: "#2a1e24",
      heading: "#e8d5a3",
    },
    spacing: { margin: 70, lineHeight: 1.9, paragraphGap: 20 },
    headingTransform: "capitalize",
    headingLetterSpacing: "0.08em",
    headingWeight: 700,
    headingBorderBottom: "1px solid #c9a84c",
    bodyTextAlign: "justify",
    blockquoteBorderColor: "#c9a84c",
    dropCapEnabled: true,
  },
};

export const PAGE_SIZES: Record<string, { width: number; height: number; label: string }> = {
  A4: { width: 210, height: 297, label: "A4 (210×297mm)" },
  A5: { width: 148, height: 210, label: "A5 (148×210mm)" },
  "US Letter": { width: 216, height: 279, label: "US Letter (216×279mm)" },
  Kindle: { width: 127, height: 203, label: "Kindle (127×203mm)" },
  Custom: { width: 200, height: 280, label: "Niestandardowy" },
};
