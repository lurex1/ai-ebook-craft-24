/**
 * AI Analysis — pełny raport z analizy rozmowy.
 * Automatycznie uruchamia analizę po wejściu, obsługuje błędy,
 * pozwala ponowić analizę i przejść do propozycji odpowiedzi.
 */

import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { AnalysisReport } from "@/components/AnalysisReport";
import { ErrorBox } from "@/components/ErrorBox";
import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";

export function AnalysisScreen() {
  const router = useRouter();
  const { record, runAnalysis } = useAnalysisFlow();
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
  // (powrót z ekranu odpowiedzi nie generuje nowego zapytania)
  useEffect(() => {
    if (!record) {
      startAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <ScreenHeader title="Analiza AI" />
        <ErrorBox message={error ?? "Brak danych do analizy."} onRetry={startAnalysis} />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScreenHeader title="Analiza AI" />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <AnalysisReport analysis={record.analysis} />

        <View className="gap-3 mt-2">
          <GradientButton
            label="Zobacz propozycje odpowiedzi"
            icon="💬"
            onPress={() => router.push("/replies")}
          />
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
