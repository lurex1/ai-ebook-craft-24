import { useState } from "react";
import { UploadStep } from "./UploadStep";
import { ConfigStep } from "./ConfigStep";
import { StructureStep } from "./StructureStep";
import { EditorStep } from "./EditorStep";
import { BookOpen, Upload, Settings, Sparkles, Edit3, Download } from "lucide-react";

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content?: string;
  url?: string;
}

export interface ChapterConfig {
  count: number;
  pointsPerChapter: number;
}

export interface ChapterPoint {
  id: string;
  title: string;
  content: string;
}

export interface Chapter {
  id: string;
  title: string;
  points: ChapterPoint[];
}

export interface EbookStructure {
  title: string;
  chapters: Chapter[];
}

const STEPS = [
  { id: 1, label: "Materiały", icon: Upload },
  { id: 2, label: "Konfiguracja", icon: Settings },
  { id: 3, label: "Struktura AI", icon: Sparkles },
  { id: 4, label: "Edytor", icon: Edit3 },
];

export function EbookWizard() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [config, setConfig] = useState<ChapterConfig>({ count: 5, pointsPerChapter: 3 });
  const [structure, setStructure] = useState<EbookStructure | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Scripto</h1>
              <p className="text-xs text-muted-foreground">by Paveelo</p>
            </div>
          </div>
          
          {/* Step indicator */}
          <nav className="hidden md:flex items-center gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center">
                  <button
                    onClick={() => isDone && setStep(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : isDone
                        ? "text-primary/60 hover:text-primary cursor-pointer"
                        : "text-muted-foreground"
                    }`}
                    disabled={!isDone && !isActive}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`w-8 h-px mx-1 ${isDone ? "bg-primary/40" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {step === 1 && (
          <UploadStep
            files={files}
            setFiles={setFiles}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <ConfigStep
            config={config}
            setConfig={setConfig}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StructureStep
            files={files}
            config={config}
            structure={structure}
            setStructure={setStructure}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <EditorStep
            structure={structure!}
            setStructure={setStructure}
            onBack={() => setStep(3)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 py-8 mt-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 text-xs text-muted-foreground">
            <div>
              <p className="font-medium text-foreground/60 mb-1">Scripto by Paveelo</p>
              <p>Paweł Eberle — firma nierejestrowana</p>
              <p>ul. Zamoyskiego 18H/2, 37-450 Stalowa Wola, Polska</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="/regulamin" className="hover:text-primary transition-colors">Regulamin</a>
              <a href="/polityka-prywatnosci" className="hover:text-primary transition-colors">Polityka prywatności</a>
              <a href="/polityka-cookies" className="hover:text-primary transition-colors">Polityka cookies</a>
              <a href="/rodo" className="hover:text-primary transition-colors">RODO</a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/50 mt-4">
            © {new Date().getFullYear()} Paveelo. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </footer>
    </div>
  );
}
