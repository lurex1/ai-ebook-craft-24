/**
 * Vibe Check — ekran wyników analizy (układ wg projektu ze Stitch).
 * Pasek dopasowania, duszek z dymkiem podsumowania, proponowane odpowiedzi
 * i pełny raport. Automatycznie uruchamia analizę po wejściu, obsługuje
 * błędy i pozwala ponowić analizę.
 */

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";

import { AnalysisReport } from "@/components/AnalysisReport";
import { ErrorBox } from "@/components/ErrorBox";
import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { RepliesList } from "@/components/RepliesList";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { LOGO_DATA_URI } from "@/utils/logo";

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
        {/* Pasek dopasowania */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-ghost-muted text-sm font-bold">Szansa na odpowiedź</Text>
          <Text className="text-ghost-pink text-sm font-bold">Match: {analysis.replyChance}%</Text>
        </View>
        <View className="h-3 bg-ghost-cardLight rounded-full overflow-hidden mb-6">
          <LinearGradient
            colors={["#FF4FA0", "#FF2D8D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${analysis.replyChance}%`, height: "100%", borderRadius: 999 }}
          />
        </View>

        {/* Duszek z dymkiem podsumowania */}
        <View className="flex-row items-start gap-3 mb-8">
          <Image source={{ uri: LOGO_DATA_URI }} style={{ width: 56, height: 56 }} />
          <View className="flex-1 bg-ghost-pink rounded-3xl rounded-tl-md px-4 py-3">
            <Text className="text-white text-sm font-bold leading-5">{analysis.summary}</Text>
          </View>
        </View>

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
