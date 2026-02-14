import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ProjectData } from "@/lib/blocks";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project: ProjectData;
  onUpdateProject: (updates: Partial<ProjectData>) => void;
}

export function CoverGenerator({ open, onOpenChange, project, onUpdateProject }: Props) {
  const { toast } = useToast();
  const [style, setStyle] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(project.cover_url || "");

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ebook", {
        body: {
          action: "cover",
          title: project.title,
          subtitle: project.subtitle,
          style,
        },
      });
      if (error) throw error;
      if (data.coverUrl) {
        setPreview(data.coverUrl);
        onUpdateProject({ cover_url: data.coverUrl });
        toast({ title: "Okładka wygenerowana!" });
      }
    } catch (err: any) {
      toast({ title: "Błąd", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Generator okładki AI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs text-muted-foreground">Tytuł</label>
            <Input value={project.title} disabled className="bg-secondary border-border mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Styl</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-secondary border-border mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Profesjonalny</SelectItem>
                <SelectItem value="modern">Nowoczesny</SelectItem>
                <SelectItem value="minimalist">Minimalistyczny</SelectItem>
                <SelectItem value="artistic">Artystyczny</SelectItem>
                <SelectItem value="tech">Technologiczny</SelectItem>
                <SelectItem value="dark">Ciemny</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generate}
            disabled={loading}
            className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generuj okładkę
          </Button>

          {preview && (
            <div className="mt-4 rounded-lg overflow-hidden border border-border/50">
              <img src={preview} alt="Okładka" className="w-full" />
            </div>
          )}

          {!preview && (
            <div className="flex items-center justify-center h-40 bg-secondary rounded-lg">
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs">Wygeneruj okładkę powyżej</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground">Lub wklej URL obrazu okładki</label>
            <Input
              value={preview}
              onChange={(e) => {
                setPreview(e.target.value);
                onUpdateProject({ cover_url: e.target.value });
              }}
              placeholder="https://..."
              className="bg-secondary border-border mt-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
