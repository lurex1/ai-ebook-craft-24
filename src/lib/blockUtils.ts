import type { Block } from "./blocks";

/**
 * Clean raw markdown symbols from AI-generated content and convert to proper HTML.
 */
export function cleanMarkdownToHtml(text: string): string {
  let html = text;

  // If it's already HTML (has tags), just clean up any stray markdown
  if (html.includes("<p>") || html.includes("<h3>") || html.includes("<ul>")) {
    // Remove stray markdown symbols that AI might have mixed in
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
    html = html.replace(/^#{1,3}\s+(.+)$/gm, "<h3>$1</h3>");
    return html;
  }

  // Convert markdown to HTML
  // Headers
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^# (.+)$/gm, "<h3>$1</h3>");

  // Bold and italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/___([^_]+)___/g, "<strong><em>$1</em></strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

  // Blockquotes
  html = html.replace(/^>\s*(.+)$/gm, "<blockquote>$1</blockquote>");

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Numbered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

  // Wrap remaining plain text lines in <p> tags
  const lines = html.split("\n");
  const result: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("<")) {
      result.push(trimmed);
    } else {
      result.push(`<p>${trimmed}</p>`);
    }
  }

  return result.join("\n");
}

/**
 * Split a large HTML content string into multiple smaller text blocks.
 * Each block should be a coherent section (a few paragraphs).
 */
export function splitContentIntoBlocks(content: string): Block[] {
  const cleaned = cleanMarkdownToHtml(content);
  const blocks: Block[] = [];

  // Extract image suggestions
  const imageMatches = cleaned.match(/<!-- IMAGE: (.+?) -->/g) || [];

  // Remove image comments from content
  let processedContent = cleaned.replace(/<!-- IMAGE: .+? -->/g, "");

  // Split by h3 tags to create logical sections
  const sections = processedContent.split(/(?=<h3>)/);

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Check if section starts with h3
    const h3Match = trimmed.match(/^<h3>(.+?)<\/h3>/);
    if (h3Match) {
      // Add subheading as a heading block
      blocks.push({
        id: crypto.randomUUID(),
        type: "heading",
        content: h3Match[1],
        level: 3,
      });

      // Rest of the section becomes a text block
      const rest = trimmed.replace(/^<h3>.+?<\/h3>\s*/, "").trim();
      if (rest) {
        // Split further if the text is very long (>1500 chars)
        const chunks = splitLongText(rest, 1500);
        for (const chunk of chunks) {
          blocks.push({
            id: crypto.randomUUID(),
            type: "text",
            content: chunk,
          });
        }
      }
    } else {
      // No h3, just a text block - split if too long
      const chunks = splitLongText(trimmed, 1500);
      for (const chunk of chunks) {
        blocks.push({
          id: crypto.randomUUID(),
          type: "text",
          content: chunk,
        });
      }
    }
  }

  // Insert image suggestion markers at logical positions
  if (imageMatches.length > 0 && blocks.length > 2) {
    // Place image blocks after ~1/3 and ~2/3 of content
    const positions = [
      Math.floor(blocks.length / 3),
      Math.floor((blocks.length * 2) / 3),
    ];

    let offset = 0;
    for (let i = 0; i < Math.min(imageMatches.length, positions.length); i++) {
      const desc = imageMatches[i].replace(/<!-- IMAGE: /, "").replace(/ -->/, "");
      blocks.splice(positions[i] + offset, 0, {
        id: crypto.randomUUID(),
        type: "image",
        url: "",
        alt: desc,
        width: 80,
      });
      offset++;
    }
  }

  return blocks;
}

/**
 * Split long HTML text at paragraph boundaries.
 */
function splitLongText(html: string, maxLen: number): string[] {
  if (html.length <= maxLen) return [html];

  const parts: string[] = [];
  // Split by closing paragraph/list/blockquote tags
  const segments = html.split(/(?<=<\/p>|<\/ul>|<\/ol>|<\/blockquote>|<\/table>)\s*/);

  let current = "";
  for (const seg of segments) {
    if (current.length + seg.length > maxLen && current.length > 0) {
      parts.push(current.trim());
      current = seg;
    } else {
      current += (current ? "\n" : "") + seg;
    }
  }
  if (current.trim()) parts.push(current.trim());

  return parts.length > 0 ? parts : [html];
}
