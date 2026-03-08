export type BlockType = "heading" | "text" | "image" | "spacer" | "chapter-break";

export interface Block {
  id: string;
  type: BlockType;
  content?: string;
  level?: 1 | 2 | 3;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  align?: "left" | "center" | "right";
  textColor?: string;
  bgColor?: string;
  // Free positioning (percentage of content area, undefined = flow layout)
  posX?: number;
  posY?: number;
}

export function createBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "heading":
      return { id, type, content: "Nowy nagłówek", level: 2 };
    case "text":
      return { id, type, content: "Nowy akapit tekstu. Kliknij aby edytować." };
    case "image":
      return { id, type, url: "", alt: "Obraz", width: 100 };
    case "spacer":
      return { id, type, height: 40 };
    case "chapter-break":
      return { id, type };
    default:
      return { id, type: "text", content: "" };
  }
}

export interface ProjectData {
  id: string;
  user_id: string;
  title: string;
  subtitle: string;
  author_name: string;
  description: string;
  language: string;
  page_size: string;
  custom_width?: number;
  custom_height?: number;
  template: string;
  cover_url?: string;
  header_config: Record<string, any>;
  footer_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChapterData {
  id: string;
  project_id: string;
  title: string;
  sort_order: number;
  blocks: Block[];
  created_at: string;
  updated_at: string;
}
