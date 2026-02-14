import { ArrowLeft, ArrowRight, BookOpen, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { ChapterConfig } from "./EbookWizard";

interface Props {
  config: ChapterConfig;
  setConfig: (c: ChapterConfig) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ConfigStep({ config, setConfig, onNext, onBack }: Props) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-bold text-foreground mb-3">
          Skonfiguruj <span className="text-gradient-gold">strukturę</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Określ liczbę rozdziałów i punktów w każdym rozdziale.
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-10">
        {/* Chapters */}
        <div className="bg-card rounded-xl p-6 border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Liczba rozdziałów</p>
              <p className="text-sm text-muted-foreground">Ile rozdziałów ma mieć Twój e-book?</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Slider
              value={[config.count]}
              onValueChange={([v]) => setConfig({ ...config, count: v })}
              min={2}
              max={20}
              step={1}
              className="flex-1"
            />
            <span className="text-2xl font-display font-bold text-primary w-10 text-right">
              {config.count}
            </span>
          </div>
        </div>

        {/* Points */}
        <div className="bg-card rounded-xl p-6 border border-border/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <List className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Punkty na rozdział</p>
              <p className="text-sm text-muted-foreground">Ile podpunktów w każdym rozdziale?</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Slider
              value={[config.pointsPerChapter]}
              onValueChange={([v]) => setConfig({ ...config, pointsPerChapter: v })}
              min={1}
              max={10}
              step={1}
              className="flex-1"
            />
            <span className="text-2xl font-display font-bold text-primary w-10 text-right">
              {config.pointsPerChapter}
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="text-center text-sm text-muted-foreground">
          Twój e-book będzie miał <span className="text-primary font-semibold">{config.count}</span> rozdziałów
          × <span className="text-primary font-semibold">{config.pointsPerChapter}</span> punktów
          = <span className="text-foreground font-semibold">{config.count * config.pointsPerChapter}</span> sekcji
        </div>
      </div>

      {/* Nav */}
      <div className="flex justify-between mt-10">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Wstecz
        </Button>
        <Button onClick={onNext} className="bg-gradient-gold text-primary-foreground hover:opacity-90 gap-2 px-6">
          Generuj strukturę <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
