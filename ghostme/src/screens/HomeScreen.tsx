/**
 * Home — główny ekran aplikacji.
 * Duży przycisk startu analizy, podgląd ostatnich analiz i wejście w Ustawienia.
 */

import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { HistoryItem } from "@/components/HistoryItem";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { useHistory } from "@/hooks/useHistory";
import { isDemoMode } from "@/services/config";

export function HomeScreen() {
  const router = useRouter();
  const { reset } = useAnalysisFlow();
  const { history, removeRecord } = useHistory();

  // Na Home pokazujemy tylko 3 najnowsze analizy
  const recent = history.slice(0, 3);

  const startAnalysis = () => {
    reset(); // czyścimy poprzednią sesję przed nową analizą
    router.push("/upload");
  };

  return (
    <GradientBackground>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Nagłówek z logo i przyciskiem ustawień */}
        <View className="flex-row items-center justify-between py-6">
          <View className="flex-row items-center gap-2">
            <Text className="text-3xl">👻</Text>
            <Text className="text-ghost-text text-2xl font-bold">GhostMe</Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={12}
            className="w-11 h-11 rounded-full bg-ghost-card border border-ghost-border items-center justify-center active:opacity-70"
          >
            <Text className="text-xl">⚙️</Text>
          </Pressable>
        </View>

        {/* Informacja o trybie demo (brak klucza API) */}
        {isDemoMode() ? (
          <View className="bg-ghost-cardLight border border-ghost-border rounded-2xl px-4 py-3 mb-4">
            <Text className="text-ghost-muted text-sm">
              🧪 Tryb demo — dodaj klucz API w pliku .env, aby korzystać z prawdziwej analizy AI.
            </Text>
          </View>
        ) : null}

        {/* Główna akcja */}
        <View className="bg-ghost-card border border-ghost-border rounded-[32px] p-6 mb-8 items-center">
          <Text className="text-5xl mb-3">💬</Text>
          <Text className="text-ghost-text text-xl font-bold text-center mb-1">
            Nie wiesz, co odpisać? 👀
          </Text>
          <Text className="text-ghost-muted text-sm text-center mb-5">
            Wrzuć screena rozmowy — AI rozkmini vibe i podpowie idealną odpowiedź ✨
          </Text>
          <GradientButton label="Przeanalizuj rozmowę" icon="🔮" onPress={startAnalysis} />
        </View>

        {/* Ostatnie analizy */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-ghost-text text-lg font-bold">Ostatnie rozkminy</Text>
          {history.length > 0 ? (
            <Pressable onPress={() => router.push("/history")} hitSlop={8} className="active:opacity-70">
              <Text className="text-ghost-pink text-sm font-bold">Zobacz wszystkie →</Text>
            </Pressable>
          ) : null}
        </View>

        {recent.length === 0 ? (
          <View className="bg-ghost-card border border-ghost-border rounded-[32px] p-6 items-center">
            <Text className="text-ghost-muted text-sm text-center">
              Jeszcze pusto. Wrzuć pierwszego screena 👆💜
            </Text>
          </View>
        ) : (
          recent.map((record) => (
            <HistoryItem
              key={record.id}
              record={record}
              onPress={() => router.push({ pathname: "/history/[id]", params: { id: record.id } })}
              onLongPress={() => removeRecord(record.id)}
            />
          ))
        )}
      </ScrollView>
    </GradientBackground>
  );
}
