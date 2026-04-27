import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Link as LinkIcon, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Block } from "@/lib/blocks";
import { invokeGenerateEbook } from "@/lib/aiInvoke";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImport: (blocks: Block[]) => void;
  projectTitle: string;
}

function textToBlocks(text: string): Block[] {
  const lines = text.split("\n").filter((l) => l.trim());
  const blocks: Block[] = [];
  for (const line of lines) {
    if (line.startsWith("# ")) {
      blocks.push({ id: crypto.randomUUID(), type: "heading", content: line.replace("# ", ""), level: 1 });
    } else if (line.startsWith("## ")) {
      blocks.push({ id: crypto.randomUUID(), type: "heading", content: line.replace("## ", ""), level: 2 });
    } else if (line.startsWith("### ")) {
      blocks.push({ id: crypto.randomUUID(), type: "heading", content: line.replace("### ", ""), level: 3 });
    } else {
      blocks.push({ id: crypto.randomUUID(), type: "text", content: line });
    }
  }
  return blocks;
}

export function ImportDialog({ open, onOpenChange, onImport, projectTitle }: Props) {
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const importText = () => {
    if (!text.trim()) return;
    onImport(textToBlocks(text));
    setText("");
  };

  const importUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await invokeGenerateEbook({ action: "import-url", url });
      if (error) throw error;
      onImport(textToBlocks(data.text));
      setUrl("");
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const importAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await invokeGenerateEbook({
          action: "structure",
          materials: prompt,
          chaptersCount: 5,
          pointsPerChapter: 3,
        });
      if (error) throw error;
      const blocks: Block[] = [];
      blocks.push({ id: crypto.randomUUID(), type: "heading", content: data.title, level: 1 });
      for (const ch of data.chapters || []) {
        blocks.push({ id: crypto.randomUUID(), type: "heading", content: ch.title, level: 2 });
        for (const pt of ch.points || []) {
          blocks.push({ id: crypto.randomUUID(), type: "heading", content: pt.title, level: 3 });
          if (pt.content) blocks.push({ id: crypto.randomUUID(), type: "text", content: pt.content });
        }
      }
      onImport(blocks);
      setPrompt("");
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Importuj treść</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary w-full">
            <TabsTrigger value="text" className="flex-1 gap-1 text-xs"><Type className="h-3 w-3" />Tekst</TabsTrigger>
            <TabsTrigger value="url" className="flex-1 gap-1 text-xs"><LinkIcon className="h-3 w-3" />URL</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 gap-1 text-xs"><Sparkles className="h-3 w-3" />AI</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="space-y-3 mt-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Wklej tekst... Użyj # dla nagłówków"
              className="bg-secondary border-border min-h-[200px] text-sm"
            />
            <Button onClick={importText} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
              Importuj tekst
            </Button>
          </TabsContent>
          <TabsContent value="url" className="space-y-3 mt-4">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://artykul.pl/..."
              className="bg-secondary border-border"
            />
            <Button onClick={importUrl} disabled={loading} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Importuj z URL
            </Button>
          </TabsContent>
          <TabsContent value="ai" className="space-y-3 mt-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Opisz temat e-booka, np.: Stwórz profesjonalny e-book o programowaniu w React, obejmujący podstawy, hooki, zarządzanie stanem i optymalizację..."
              className="bg-secondary border-border min-h-[120px] text-sm"
            />
            <Button onClick={importAI} disabled={loading} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <Sparkles className="h-4 w-4" /> Generuj strukturę AI
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
