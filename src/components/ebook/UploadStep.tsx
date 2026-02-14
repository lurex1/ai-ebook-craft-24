import { useCallback, useRef } from "react";
import { Upload, FileText, Image, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UploadedFile } from "./EbookWizard";

interface Props {
  files: UploadedFile[];
  setFiles: (files: UploadedFile[]) => void;
  onNext: () => void;
}

export function UploadStep({ files, setFiles, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const newFiles: UploadedFile[] = [];
      for (const file of Array.from(fileList)) {
        const uf: UploadedFile = {
          name: file.name,
          type: file.type,
          size: file.size,
        };
        // Read text content for text files
        if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
          uf.content = await file.text();
        }
        // For images, create object URL
        if (file.type.startsWith("image/")) {
          uf.url = URL.createObjectURL(file);
        }
        newFiles.push(uf);
      }
      setFiles([...files, ...newFiles]);
    },
    [files, setFiles]
  );

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const getIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4 text-primary" />;
    return <FileText className="h-4 w-4 text-primary" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-bold text-foreground mb-3">
          Wgraj <span className="text-gradient-gold">materiały</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Dodaj pliki tekstowe, PDF-y i grafiki, z których AI stworzy Twój e-book.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-12 text-center cursor-pointer transition-all group hover:bg-primary/5"
      >
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <p className="text-foreground font-medium mb-1">Przeciągnij i upuść pliki</p>
        <p className="text-sm text-muted-foreground">lub kliknij, aby wybrać</p>
        <p className="text-xs text-muted-foreground/60 mt-2">TXT, PDF, PNG, JPG, WEBP — do 20 MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.pdf,.md,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-card rounded-lg px-4 py-3 border border-border/50 animate-fade-in"
            >
              <div className="flex items-center gap-3">
                {getIcon(f.type)}
                <div>
                  <p className="text-sm font-medium text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(f.size)}</p>
                </div>
              </div>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Next */}
      <div className="flex justify-end mt-8">
        <Button
          onClick={onNext}
          disabled={files.length === 0}
          className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2 px-6"
        >
          Dalej <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
