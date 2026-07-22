/**
 * Pełny raport analizy — wszystkie sekcje wyniku AI.
 * Współdzielony przez ekran Analizy oraz podgląd wpisu w Historii.
 */

import { Text, View } from "react-native";

import type { AnalysisResult } from "@/types/analysis";
import { ChanceBar } from "./ChanceBar";
import { FlagList } from "./FlagList";
import { GhostCard } from "./GhostCard";

interface AnalysisReportProps {
  analysis: AnalysisResult;
  /** Ukrywa kartę z szansą na odpowiedź (gdy ekran pokazuje ją już wyżej) */
  hideChance?: boolean;
}

export function AnalysisReport({ analysis, hideChance = false }: AnalysisReportProps) {
  return (
    <View>
      <GhostCard icon="😊" title="Ton rozmowy">
        <Text className="text-ghost-text text-base leading-6">{analysis.tone}</Text>
      </GhostCard>

      <GhostCard icon="❤️" title="Poziom zainteresowania">
        <Text className="text-ghost-text text-base leading-6">{analysis.interestLevel}</Text>
      </GhostCard>

      {!hideChance ? (
        <GhostCard icon="📈" title="Szansa na odpowiedź">
          <ChanceBar percent={analysis.replyChance} />
        </GhostCard>
      ) : null}

      <GhostCard icon="🚩" title="Red flagi">
        <FlagList items={analysis.redFlags} variant="red" emptyText="Brak red flag — czysto! 🎉" />
      </GhostCard>

      <GhostCard icon="✅" title="Green flagi">
        <FlagList items={analysis.greenFlags} variant="green" emptyText="Brak wyraźnych green flag." />
      </GhostCard>

      <GhostCard icon="🧠" title="Co oznacza zachowanie drugiej osoby">
        <Text className="text-ghost-text text-base leading-6">{analysis.behaviorInsight}</Text>
      </GhostCard>

      <GhostCard icon="📋" title="Podsumowanie">
        <Text className="text-ghost-text text-base leading-6 mb-3">{analysis.summary}</Text>
        <View
          className={`self-start rounded-full px-4 py-2 ${
            analysis.worthContinuing ? "bg-ghost-success/20" : "bg-ghost-danger/20"
          }`}
        >
          <Text
            className={`text-sm font-bold ${
              analysis.worthContinuing ? "text-ghost-success" : "text-ghost-danger"
            }`}
          >
            {analysis.worthContinuing ? "✅ Warto kontynuować rozmowę" : "🚩 Lepiej odpuścić tę rozmowę"}
          </Text>
        </View>
      </GhostCard>
    </View>
  );
}
