/**
 * Vibe Check — ekran wyników analizy (układ wg projektu ze Stitch).
 * Pasek dopasowania, duszek z dymkiem podsumowania, proponowane odpowiedzi
 * i pełny raport. Automatycznie uruchamia analizę po wejściu, obsługuje
 * błędy i pozwala ponowić analizę.
 */

import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { AnalysisReport } from "@/components/AnalysisReport";
import { ErrorBox } from "@/components/ErrorBox";
import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { MatchSummary } from "@/components/MatchSummary";
import { RepliesList } from "@/components/RepliesList";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";

export function AnalysisScreen() {
  const router = useRouter();
  const { record, runAnalysis, reset } = useAnalysisFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Uruchamia analizę AI (także jako "przeanalizuj ponownie"). */
  const startAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await runAnalysis();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się przeanalizować rozmowy.");
    } finally {
      setLoading(false);
    }
  }, [runAnalysis]);

  // Analiza startuje automatycznie tylko przy pierwszym wejściu
  // (powrót na ekran nie generuje nowego zapytania)
  useEffect(() => {
    if (!record) {
      startAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishFlow = () => {
    reset();
    router.dismissAll(); // wracamy na sam początek (zakładki)
  };

  if (loading) {
    return (
      <GradientBackground>
        <LoadingOverlay message="Rozkminiam Waszą rozmowę..." hint="Sprawdzam vibe, sygnały i szanse na odpowiedź 🔮" />
      </GradientBackground>
    );
  }

  if (error || !record) {
    return (
      <GradientBackground>
        <ScreenHeader title="Vibe Check" />
        <ErrorBox message={error ?? "Brak danych do analizy."} onRetry={startAnalysis} />
      </GradientBackground>
    );
  }

  const { analysis, replies } = record;

  return (
    <GradientBackground>
      <ScreenHeader title="Vibe Check" />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Pasek dopasowania + duszek z podsumowaniem */}
        <MatchSummary percent={analysis.replyChance} summary={analysis.summary} />

        {/* Proponowane odpowiedzi */}
        <RepliesList replies={replies} />

        {/* Pełny raport */}
        <Text className="text-ghost-text text-lg font-bold mb-4 mt-4">🔍 Pełny raport</Text>
        <AnalysisReport analysis={analysis} hideChance />

        <View className="gap-3 mt-2">
          <GradientButton label="ZAKOŃCZ I WRÓĆ NA START" icon="👻" onPress={finishFlow} />
          <GradientButton
            label="Przeanalizuj ponownie"
            icon="🔄"
            variant="secondary"
            onPress={startAnalysis}
          />
        </View>

        <Text className="text-ghost-muted text-xs text-center mt-6">
          Analiza AI ma charakter pomocniczy — ostateczna decyzja zawsze należy do Ciebie 💜
        </Text>
      </ScrollView>
    </GradientBackground>
  );
}
