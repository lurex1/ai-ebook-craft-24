/**
 * OCR — odczyt tekstu ze screenshota.
 * Automatycznie uruchamia OCR po wejściu na ekran, pozwala ręcznie
 * poprawić tekst i przejść do analizy AI.
 */

import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";

import { ErrorBox } from "@/components/ErrorBox";
import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";

export function OcrScreen() {
  const router = useRouter();
  const { ocrText, setOcrText, runOcr } = useAnalysisFlow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Uruchamia OCR i obsługuje błędy (z możliwością ponowienia). */
  const startOcr = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await runOcr();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się odczytać tekstu ze zdjęcia.");
    } finally {
      setLoading(false);
    }
  }, [runOcr]);

  // OCR startuje automatycznie, ale tylko gdy nie mamy jeszcze tekstu
  // (powrót z ekranu analizy nie nadpisuje ręcznych poprawek)
  useEffect(() => {
    if (!ocrText) {
      startOcr();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <GradientBackground>
        <LoadingOverlay message="Odczytuję tekst ze screenshota..." hint="To potrwa kilka sekund" />
      </GradientBackground>
    );
  }

  if (error) {
    return (
      <GradientBackground>
        <ScreenHeader title="Odczyt tekstu" />
        <ErrorBox message={error} onRetry={startOcr} />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScreenHeader title="Odczyt tekstu" />
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
          <Text className="text-ghost-muted text-base mb-4">
            Sprawdź odczytany tekst i popraw go, jeśli coś się nie zgadza.
          </Text>

          {/* Edytowalny wynik OCR */}
          <View className="bg-ghost-card border border-ghost-border rounded-3xl p-4 mb-6">
            <TextInput
              value={ocrText}
              onChangeText={setOcrText}
              multiline
              textAlignVertical="top"
              placeholder="Tutaj pojawi się tekst rozmowy..."
              placeholderTextColor="#9D93C4"
              className="text-ghost-text text-base leading-6 min-h-[260px]"
            />
          </View>

          <View className="gap-3">
            <GradientButton label="Odczytaj ponownie" icon="🔄" variant="secondary" onPress={startOcr} />
            <GradientButton
              label="Dalej"
              icon="➡️"
              onPress={() => router.push("/analysis")}
              disabled={!ocrText.trim()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}
