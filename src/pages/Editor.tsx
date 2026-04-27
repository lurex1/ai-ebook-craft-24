import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TEMPLATES } from "@/lib/templates";
import type { Block, ChapterData, ProjectData } from "@/lib/blocks";
import { createBlock } from "@/lib/blocks";
import { splitContentIntoBlocks, normalizeBlocks } from "@/lib/blockUtils";
import { LeftPanel } from "@/components/editor/LeftPanel";
import { CenterCanvas } from "@/components/editor/CenterCanvas";
import { RightPanel } from "@/components/editor/RightPanel";
import { FlipbookView } from "@/components/editor/FlipbookView";
import {
  BookOpen, ArrowLeft, Save, Loader2, Check,
  Import, Download, ImageIcon, Sparkles, Wand2, Plus, BookOpenCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportDialog } from "@/components/editor/ImportDialog";
import { ExportDialog } from "@/components/editor/ExportDialog";
import { CoverGenerator } from "@/components/editor/CoverGenerator";
import { Progress } from "@/components/ui/progress";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const [project, setProject] = useState<ProjectData | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0 });
  const [flipbookOpen, setFlipbookOpen] = useState(false);
  const [scrollToBlockId, setScrollToBlockId] = useState<string | null>(null);

  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) loadData();
  }, [user, id]);

  const loadData = async () => {
    const [{ data: proj }, { data: chs }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).maybeSingle(),
      supabase.from("chapters").select("*").eq("project_id", id).order("sort_order"),
    ]);
    if (!proj) { navigate("/"); return; }
    setProject(proj as any);
    const parsedChapters = ((chs as any[]) || []).map((c) => {
      const rawBlocks = Array.isArray(c.blocks) ? c.blocks : [];
      const normalized = normalizeBlocks(rawBlocks);
      // Save normalized blocks back if they changed (compare JSON to detect content splits)
      const changed = JSON.stringify(normalized) !== JSON.stringify(rawBlocks);
      if (changed) {
        supabase.from("chapters").update({ blocks: normalized as any }).eq("id", c.id);
      }
      return { ...c, blocks: normalized };
    });
    setChapters(parsedChapters);
    if (parsedChapters.length > 0) setSelectedChapterId(parsedChapters[0].id);
    setLoading(false);
  };

  const currentChapter = chapters.find((c) => c.id === selectedChapterId);
  const template = TEMPLATES[project?.template || "modern"] || TEMPLATES.modern;

  // Auto-save chapter blocks
  const saveChapter = useCallback(
    async (chapterId: string, blocks: Block[]) => {
      setSaveStatus("saving");
      await supabase
        .from("chapters")
        .update({ blocks: blocks as any })
        .eq("id", chapterId);
      setSaveStatus("saved");
    },
    []
  );

  const debouncedSave = useCallback(
    (chapterId: string, blocks: Block[]) => {
      setSaveStatus("unsaved");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => saveChapter(chapterId, blocks), 1000);
    },
    [saveChapter]
  );

  const updateBlocks = useCallback(
    (newBlocks: Block[]) => {
      if (!selectedChapterId) return;
      setChapters((prev) =>
        prev.map((c) => (c.id === selectedChapterId ? { ...c, blocks: newBlocks } : c))
      );
      debouncedSave(selectedChapterId, newBlocks);
    },
    [selectedChapterId, debouncedSave]
  );

  const addBlock = useCallback(
    (type: Block["type"], afterBlockId?: string) => {
      if (!currentChapter) return;
      const block = createBlock(type);
      const blocks = [...currentChapter.blocks];
      const targetId = afterBlockId || selectedBlockId;
      if (targetId) {
        const idx = blocks.findIndex((b) => b.id === targetId);
        blocks.splice(idx + 1, 0, block);
      } else {
        blocks.push(block);
      }
      updateBlocks(blocks);
      setSelectedBlockId(block.id);
    },
    [currentChapter, updateBlocks, selectedBlockId]
  );

  const updateBlock = useCallback(
    (blockId: string, updates: Partial<Block>) => {
      if (!currentChapter) return;
      const newBlocks = currentChapter.blocks.map((b) =>
        b.id === blockId ? { ...b, ...updates } : b
      );
      updateBlocks(newBlocks);
    },
    [currentChapter, updateBlocks]
  );

  const deleteBlock = useCallback(
    (blockId: string) => {
      if (!currentChapter) return;
      updateBlocks(currentChapter.blocks.filter((b) => b.id !== blockId));
      if (selectedBlockId === blockId) setSelectedBlockId(null);
    },
    [currentChapter, updateBlocks, selectedBlockId]
  );

  const moveBlock = useCallback(
    (blockId: string, dir: -1 | 1) => {
      if (!currentChapter) return;
      const blocks = [...currentChapter.blocks];
      const idx = blocks.findIndex((b) => b.id === blockId);
      const target = idx + dir;
      if (target < 0 || target >= blocks.length) return;
      [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
      updateBlocks(blocks);
    },
    [currentChapter, updateBlocks]
  );

  const reorderBlocks = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!currentChapter) return;
      const blocks = [...currentChapter.blocks];
      const [moved] = blocks.splice(fromIndex, 1);
      blocks.splice(toIndex, 0, moved);
      updateBlocks(blocks);
    },
    [currentChapter, updateBlocks]
  );

  const duplicateBlock = useCallback(
    (blockId: string) => {
      if (!currentChapter) return;
      const blocks = [...currentChapter.blocks];
      const idx = blocks.findIndex((b) => b.id === blockId);
      if (idx === -1) return;
      const original = blocks[idx];
      const copy: Block = {
        ...original,
        id: crypto.randomUUID(),
        ...(original.posX != null ? { posX: (original.posX || 0) + 16 } : {}),
        ...(original.posY != null ? { posY: (original.posY || 0) + 16 } : {}),
      };
      blocks.splice(idx + 1, 0, copy);
      updateBlocks(blocks);
      setSelectedBlockId(copy.id);
    },
    [currentChapter, updateBlocks]
  );

  const extractToBlock = useCallback(
    (sourceBlockId: string, html: string) => {
      if (!currentChapter) return;
      const newBlock: Block = {
        id: crypto.randomUUID(),
        type: "text",
        content: html,
      };
      const blocks = [...currentChapter.blocks];
      const idx = blocks.findIndex((b) => b.id === sourceBlockId);
      blocks.splice(idx + 1, 0, newBlock);
      updateBlocks(blocks);
      setSelectedBlockId(newBlock.id);
    },
    [currentChapter, updateBlocks]
  );

  // Chapter operations
  const addChapter = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("chapters")
      .insert({
        project_id: id,
        title: `Rozdział ${chapters.length + 1}`,
        sort_order: chapters.length,
        blocks: [{ id: crypto.randomUUID(), type: "heading", content: "Nowy rozdział", level: 1 }],
      } as any)
      .select()
      .single();
    if (data) {
      const ch = { ...(data as any), blocks: (data as any).blocks || [] };
      setChapters((prev) => [...prev, ch]);
      setSelectedChapterId(ch.id);
    }
  };

  const deleteChapter = async (chapterId: string) => {
    if (chapters.length <= 1) { toast({ title: "Musi być co najmniej jeden rozdział" }); return; }
    await supabase.from("chapters").delete().eq("id", chapterId);
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
    if (selectedChapterId === chapterId) {
      setSelectedChapterId(chapters.find((c) => c.id !== chapterId)?.id || null);
    }
  };

  const renameChapter = async (chapterId: string, title: string) => {
    await supabase.from("chapters").update({ title } as any).eq("id", chapterId);
    setChapters((prev) => prev.map((c) => (c.id === chapterId ? { ...c, title } : c)));
  };

  const moveChapter = async (chapterId: string, dir: -1 | 1) => {
    const idx = chapters.findIndex((c) => c.id === chapterId);
    const target = idx + dir;
    if (target < 0 || target >= chapters.length) return;
    const newChapters = [...chapters];
    [newChapters[idx], newChapters[target]] = [newChapters[target], newChapters[idx]];
    newChapters.forEach((c, i) => (c.sort_order = i));
    setChapters(newChapters);
    for (const c of newChapters) {
      await supabase.from("chapters").update({ sort_order: c.sort_order } as any).eq("id", c.id);
    }
  };

  const updateProject = async (updates: Partial<ProjectData>) => {
    if (!project) return;
    setProject({ ...project, ...updates });
    await supabase.from("projects").update(updates as any).eq("id", project.id);
  };

  const handleImportContent = (blocks: Block[]) => {
    if (!currentChapter) return;
    updateBlocks([...currentChapter.blocks, ...blocks]);
    setImportOpen(false);
    toast({ title: "Zaimportowano treść" });
  };

  // Generate AI illustration for a block
  const generateIllustration = async (contextText: string) => {
    if (!project || !currentChapter) return;
    // Gather context from nearby text blocks
    const allText = currentChapter.blocks
      .filter((b) => b.type === "text" && b.content)
      .map((b) => b.content!)
      .join(" ")
      .slice(0, 1000);
    const finalContext = contextText || allText;

    toast({ title: "Generuję ilustrację AI..." });
    try {
      const { data, error } = await supabase.functions.invoke("generate-ebook", {
        body: {
          action: "generate-illustration",
          contextText: finalContext,
          bookTitle: project.title,
        },
      });
      if (error || !data?.imageUrl) throw new Error(data?.error || "Błąd generowania");

      // Add image block after the selected block (or at the end if nothing selected)
      const imgBlock = createBlock("image");
      imgBlock.url = data.imageUrl;
      imgBlock.alt = "Ilustracja AI";
      imgBlock.width = 80;
      const blocks = [...currentChapter.blocks];
      const insertIndex = selectedBlockId
        ? blocks.findIndex((b) => b.id === selectedBlockId) + 1
        : blocks.length;
      blocks.splice(insertIndex, 0, imgBlock);
      updateBlocks(blocks);
      toast({ title: "Dodano ilustrację!" });
    } catch (err: any) {
      toast({ title: "Błąd", description: err.message, variant: "destructive" });
    }
  };

  // Check if chapter has only headings (no real text content)
  const chapterNeedsContent = (ch: ChapterData) => {
    if (ch.blocks.length === 0) return false;
    const hasHeadings = ch.blocks.some((b) => b.type === "heading");
    const hasRealText = ch.blocks.some((b) => b.type === "text" && b.content && b.content.trim().length > 50);
    return hasHeadings && !hasRealText;
  };

  // Generate AI content for a single chapter
  const generateChapterContent = async (ch: ChapterData) => {
    if (!project) return;
    const headings = ch.blocks.filter((b) => b.type === "heading");
    if (headings.length === 0) return;

    const newBlocks: Block[] = [];
    for (let i = 0; i < ch.blocks.length; i++) {
      const block = ch.blocks[i];

      if (block.type === "heading") {
        newBlocks.push(block);

        const nextBlock = ch.blocks[i + 1];
        if (nextBlock && nextBlock.type === "text" && nextBlock.content && nextBlock.content.trim().length > 50) {
          continue;
        }

        if (nextBlock && nextBlock.type === "text" && (!nextBlock.content || nextBlock.content.trim().length <= 50)) {
          i++;
        }

        try {
          const { data, error } = await supabase.functions.invoke("generate-ebook", {
            body: {
              action: "generate-section",
              bookTitle: project.title,
              materials: "",
              sectionPath: `Rozdział: ${ch.title}`,
              sectionTitle: block.content || "",
              contextBefore: i > 0 ? ch.blocks[Math.max(0, i - 1)]?.content || "" : "",
              contextAfter: i < ch.blocks.length - 1 ? ch.blocks[i + 1]?.content || "" : "",
              totalSections: headings.length,
              currentIndex: headings.indexOf(block),
            },
          });
          if (!error && data?.content) {
            // Split AI content into multiple well-structured blocks
            const contentBlocks = splitContentIntoBlocks(data.content);
            newBlocks.push(...contentBlocks);

            // Add a small spacer between sections for visual breathing room
            newBlocks.push({ id: crypto.randomUUID(), type: "spacer", height: 20 });
          }
        } catch {
          // Skip failed generations
        }
      } else {
        if (block.type === "text" && (!block.content || block.content.trim().length <= 50)) {
          continue;
        }
        newBlocks.push(block);
      }
    }

    setChapters((prev) => prev.map((c) => c.id === ch.id ? { ...c, blocks: newBlocks } : c));
    await supabase.from("chapters").update({ blocks: newBlocks as any }).eq("id", ch.id);
  };

  const generateCurrentChapterContent = async () => {
    if (!currentChapter) return;
    setAiGenerating(true);
    setAiProgress({ current: 0, total: 1 });
    try {
      await generateChapterContent(currentChapter);
      toast({ title: "Wygenerowano treść rozdziału!" });
    } catch (err: any) {
      toast({ title: "Błąd", description: err.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
      setAiProgress({ current: 0, total: 0 });
    }
  };

  const generateAllChaptersContent = async () => {
    const chaptersToFill = chapters.filter(chapterNeedsContent);
    if (chaptersToFill.length === 0) {
      toast({ title: "Wszystkie rozdziały mają już treść" });
      return;
    }
    setAiGenerating(true);
    setAiProgress({ current: 0, total: chaptersToFill.length });

    try {
      for (let i = 0; i < chaptersToFill.length; i++) {
        setAiProgress({ current: i + 1, total: chaptersToFill.length });
        await generateChapterContent(chaptersToFill[i]);
      }
      toast({ title: "Wygenerowano treść dla wszystkich rozdziałów!" });
    } catch (err: any) {
      toast({ title: "Błąd", description: err.message, variant: "destructive" });
    } finally {
      setAiGenerating(false);
      setAiProgress({ current: 0, total: 0 });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-12 border-b border-border/50 px-3 flex items-center justify-between shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground gap-1 px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-7 w-7 rounded bg-gradient-gold flex items-center justify-center">
            <BookOpen className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <input
            value={project.title}
            onChange={(e) => updateProject({ title: e.target.value })}
            className="bg-transparent border-none text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-2 py-1 max-w-[200px]"
          />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            {saveStatus === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> {t("editor.saving")}</>}
            {saveStatus === "saved" && <><Check className="h-3 w-3 text-primary" /> {t("editor.saved")}</>}
            {saveStatus === "unsaved" && t("editor.unsaved")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={() => navigate("/new")} className="text-muted-foreground gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> {t("editor.new")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateAllChaptersContent}
            disabled={aiGenerating}
            className="text-primary gap-1 text-xs bg-primary/10 hover:bg-primary/20"
          >
            {aiGenerating ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("editor.generating")} {aiProgress.current}/{aiProgress.total}...</>
            ) : (
              <><Wand2 className="h-3.5 w-3.5" /> {t("editor.generateAI")}</>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setImportOpen(true)} className="text-muted-foreground gap-1 text-xs">
            <Import className="h-3.5 w-3.5" /> {t("editor.import")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCoverOpen(true)} className="text-muted-foreground gap-1 text-xs">
            <ImageIcon className="h-3.5 w-3.5" /> {t("editor.cover")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setFlipbookOpen(true)} className="text-muted-foreground gap-1 text-xs">
            <BookOpenCheck className="h-3.5 w-3.5" /> {t("editor.flipbook")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setExportOpen(true)} className="text-primary gap-1 text-xs">
            <Download className="h-3.5 w-3.5" /> {t("editor.export")}
          </Button>
        </div>
      </header>

      {/* AI Progress bar */}
      {aiGenerating && (
        <div className="px-4 py-2 bg-card border-b border-border/50">
          <div className="flex items-center gap-3 max-w-md">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <div className="flex-1">
              <Progress value={aiProgress.total > 0 ? (aiProgress.current / aiProgress.total) * 100 : 0} className="h-2" />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t("editor.chapter")} {aiProgress.current}/{aiProgress.total}
            </span>
          </div>
        </div>
      )}

      {/* 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel
          chapters={chapters}
          selectedChapterId={selectedChapterId}
          onSelect={setSelectedChapterId}
          onScrollToBlock={(chapterId, blockId) => {
            setSelectedChapterId(chapterId);
            setSelectedBlockId(blockId);
            setScrollToBlockId(blockId);
          }}
          onAdd={addChapter}
          onDelete={deleteChapter}
          onRename={renameChapter}
          onMove={moveChapter}
        />
        <CenterCanvas
          chapter={currentChapter || null}
          template={template}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onAddBlock={addBlock}
          onUpdateBlock={updateBlock}
          onDeleteBlock={deleteBlock}
          onMoveBlock={moveBlock}
          onReorderBlocks={reorderBlocks}
          onDuplicateBlock={duplicateBlock}
          pageSize={project.page_size}
          onGenerateContent={generateCurrentChapterContent}
          isGenerating={aiGenerating}
          onGenerateImage={generateIllustration}
          footerConfig={project.footer_config}
          watermarkText={user?.email || user?.id}
          pricePerPage={0.5}
          scrollToBlockId={scrollToBlockId}
          onScrollComplete={() => setScrollToBlockId(null)}
          onExtractToBlock={extractToBlock}
        />
        <RightPanel
          project={project}
          onUpdateProject={updateProject}
          selectedBlock={currentChapter?.blocks.find((b) => b.id === selectedBlockId) || null}
          onUpdateBlock={(updates) => selectedBlockId && updateBlock(selectedBlockId, updates)}
        />
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImportContent}
        projectTitle={project.title}
      />
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        project={project}
        chapters={chapters}
        template={template}
        watermarkText={user?.email || user?.id}
      />
      <CoverGenerator
        open={coverOpen}
        onOpenChange={setCoverOpen}
        project={project}
        onUpdateProject={updateProject}
      />
      {flipbookOpen && (
        <FlipbookView
          chapters={chapters}
          template={template}
          pageSize={project.page_size}
          onClose={() => setFlipbookOpen(false)}
          watermarkText={user?.email || user?.id}
          footerConfig={project.footer_config}
        />
      )}
    </div>
  );
}
