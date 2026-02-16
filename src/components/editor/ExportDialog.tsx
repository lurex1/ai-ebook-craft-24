import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, BookOpen, Loader2 } from "lucide-react";
import type { ProjectData, ChapterData, Block } from "@/lib/blocks";
import type { Template } from "@/lib/templates";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectData;
  chapters: ChapterData[];
  template: Template;
  watermarkText?: string;
}

function generateHTML(project: ProjectData, chapters: ChapterData[], template: Template, watermarkText?: string): string {
  const headerConfig = project.header_config || {};
  const footerConfig = project.footer_config || {};

  const renderBlock = (block: Block): string => {
    if (block.type === "heading") {
      const tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
      const sizes: Record<number, string> = { 1: "2.2em", 2: "1.6em", 3: "1.3em" };
      return `<${tag} style="font-family:${template.headingFont};font-size:${sizes[block.level || 2]};color:${template.colors.heading};margin:0 0 12px 0;font-weight:700">${block.content || ""}</${tag}>`;
    }
    if (block.type === "text") {
      const paragraphs = (block.content || "").split("\n").filter(l => l.trim());
      return paragraphs.map(p => `<p style="margin:0 0 ${template.spacing.paragraphGap}px 0;text-align:justify">${p}</p>`).join("");
    }
    if (block.type === "image" && block.url) {
      return `<div style="text-align:center;margin:20px 0"><img src="${block.url}" alt="${block.alt || ""}" style="max-width:${block.width || 100}%;border-radius:4px" /></div>`;
    }
    if (block.type === "spacer") return `<div style="height:${block.height || 40}px"></div>`;
    if (block.type === "chapter-break") return `<div style="page-break-after:always"></div>`;
    return "";
  };

  const chaptersHtml = chapters.map((ch, ci) => {
    const blocksHtml = ch.blocks.map(renderBlock).join("");
    return `<div class="chapter" style="page-break-before:${ci > 0 ? 'always' : 'auto'}">
      ${blocksHtml}
    </div>`;
  }).join("");

  const tocHtml = chapters.map((ch, ci) => `<li style="padding:6px 0;border-bottom:1px solid ${template.colors.muted}">${ci + 1}. ${ch.title}</li>`).join("");

  const headerHtml = (headerConfig.showTitle || headerConfig.showAuthor)
    ? `<div style="text-align:center;padding:8px 0;border-bottom:1px solid ${template.colors.muted};margin-bottom:20px;font-size:0.8em;color:${template.colors.accent}">
        ${headerConfig.showTitle ? project.title : ""} ${headerConfig.showAuthor && project.author_name ? `· ${project.author_name}` : ""}
      </div>`
    : "";

  return `<!DOCTYPE html><html lang="${project.language}"><head><meta charset="utf-8"><title>${project.title}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:${template.bodyFont};color:${template.colors.text};background:${template.colors.bg};line-height:${template.spacing.lineHeight}}
.page{max-width:800px;margin:0 auto;padding:${template.spacing.margin}px}
.cover{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;page-break-after:always}
.cover h1{font-family:${template.headingFont};font-size:3em;color:${template.colors.heading};margin-bottom:12px}
.cover .subtitle{font-size:1.3em;color:${template.colors.accent};margin-bottom:24px}
.cover .author{font-size:1.1em;color:${template.colors.text};opacity:0.7}
.toc{page-break-after:always;padding:40px 0}
.toc h2{font-family:${template.headingFont};font-size:1.8em;color:${template.colors.primary};margin-bottom:20px}
.toc ul{list-style:none}
@media print{body{font-size:11pt}.cover h1{font-size:2.5em}.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:3em;color:rgba(0,0,0,0.04);pointer-events:none;white-space:nowrap;z-index:9999}}
</style></head><body>
${project.cover_url ? `<div class="cover"><img src="${project.cover_url}" style="max-width:80%;max-height:80vh;border-radius:8px" /></div>` : `
<div class="cover">
  <h1>${project.title}</h1>
  ${project.subtitle ? `<p class="subtitle">${project.subtitle}</p>` : ""}
  ${project.author_name ? `<p class="author">${project.author_name}</p>` : ""}
</div>`}
<div class="page toc"><h2>Spis treści</h2><ul>${tocHtml}</ul></div>
<div class="page">${headerHtml}${chaptersHtml}</div>
<div class="page" style="border-top:2px solid ${template.colors.primary};padding-top:30px;page-break-before:always;font-size:0.85em;color:${template.colors.accent}">
<h2 style="font-family:${template.headingFont};font-size:1.5em;color:${template.colors.heading};margin-bottom:16px">Informacje prawne</h2>
<p style="margin-bottom:8px"><strong>Wydawca:</strong> Paveelo — Paweł Eberle, firma nierejestrowana</p>
<p style="margin-bottom:8px">ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola, Polska</p>
<p style="margin-bottom:8px">${footerConfig.copyrightText || "© Paveelo"}</p>
<p style="margin-top:16px;font-size:0.9em">Niniejszy e-book jest chroniony prawem autorskim. Rozpowszechnianie bez zgody wydawcy jest zabronione.</p>
</div>
${watermarkText ? `<div class="watermark" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:3em;color:rgba(0,0,0,0.04);pointer-events:none;white-space:nowrap">${watermarkText}</div>` : ""}
</body></html>`;
}

function generateTXT(project: ProjectData, chapters: ChapterData[]): string {
  let txt = `${project.title}\n`;
  if (project.subtitle) txt += `${project.subtitle}\n`;
  if (project.author_name) txt += `Autor: ${project.author_name}\n`;
  txt += "\n---\n\n";
  for (const ch of chapters) {
    for (const block of ch.blocks) {
      if (block.type === "heading") txt += `\n${"#".repeat(block.level || 2)} ${block.content}\n\n`;
      else if (block.type === "text") txt += `${block.content}\n\n`;
      else if (block.type === "chapter-break") txt += "\n---\n\n";
    }
  }
  txt += "\n---\n© Paveelo · Paweł Eberle · ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola\n";
  return txt;
}

export function ExportDialog({ open, onOpenChange, project, chapters, template, watermarkText }: Props) {
  const [exporting, setExporting] = useState(false);

  const exportPDF = () => {
    setExporting(true);
    const html = generateHTML(project, chapters, template, watermarkText);
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
    setExporting(false);
  };

  const exportTXT = () => {
    const txt = generateTXT(project, chapters);
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Eksport e-booka</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          <Button onClick={exportPDF} disabled={exporting} className="w-full justify-start gap-3 h-14 bg-secondary hover:bg-secondary/80 text-foreground">
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
              <Download className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">PDF</p>
              <p className="text-xs text-muted-foreground">Ctrl+P w nowym oknie</p>
            </div>
          </Button>
          <Button onClick={exportTXT} className="w-full justify-start gap-3 h-14 bg-secondary hover:bg-secondary/80 text-foreground">
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">TXT</p>
              <p className="text-xs text-muted-foreground">Czysty tekst</p>
            </div>
          </Button>
          <Button disabled className="w-full justify-start gap-3 h-14 bg-secondary/50 text-muted-foreground cursor-not-allowed">
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">EPUB / MOBI</p>
              <p className="text-xs">Wkrótce dostępne</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
