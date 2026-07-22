/**
 * Home — ekran główny GhostTalk (układ wg projektu ze Stitch).
 * Neonowy duszek-hero, hasło "Rozkoduj swoje czaty", różowy przycisk startu,
 * karty funkcji oraz ostatnie analizy i wejście w Ustawienia.
 */

import { useRouter } from "expo-router";
import { Image, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { HistoryItem } from "@/components/HistoryItem";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { useHistory } from "@/hooks/useHistory";
import { isDemoMode } from "@/services/config";
import { HERO_DATA_URI } from "@/utils/hero";
import { LOGO_DATA_URI } from "@/utils/logo";

/** Szeryfowy krój nagłówka hero (jak w projekcie graficznym). */
const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, 'Times New Roman', serif",
});

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
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-row items-center gap-2">
            <Image source={{ uri: LOGO_DATA_URI }} style={{ width: 38, height: 38 }} />
            <Text className="text-ghost-text text-2xl font-bold">GhostTalk</Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            hitSlop={12}
            className="w-11 h-11 rounded-full bg-ghost-card border border-ghost-border items-center justify-center active:opacity-70"
          >
            <Text className="text-xl">⚙️</Text>
          </Pressable>
        </View>

        {/* Hero: neonowy duszek */}
        <Image
          source={{ uri: HERO_DATA_URI }}
          style={{ width: "100%", aspectRatio: 900 / 720, borderRadius: 28 }}
          resizeMode="cover"
        />

        {/* Hasło */}
        <Text
          className="text-ghost-text text-center mt-6"
          style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 42, fontWeight: "700" }}
        >
          GhostTalk:{"\n"}Rozkoduj swoje czaty
        </Text>
        <Text className="text-ghost-muted text-base text-center mt-3 mb-6 px-2 leading-6">
          Sprawdź vibe i znajdź idealną odpowiedź. Nasz duszek AI przeprowadzi Cię przez
          najbardziej pogmatwane rozmowy 👻
        </Text>

        {/* Główna akcja */}
        <GradientButton label="ZACZYNAMY" icon="🔮" onPress={startAnalysis} />

        {/* Informacja o trybie demo (brak klucza API) */}
        {isDemoMode() ? (
          <Text className="text-ghost-muted text-xs text-center mt-3">
            🧪 Tryb demo — dodaj klucz API w pliku .env, aby włączyć prawdziwą analizę AI.
          </Text>
        ) : null}

        {/* Karty funkcji */}
        <View className="flex-row gap-3 mt-8">
          <View className="flex-1 bg-ghost-card border border-ghost-border rounded-3xl p-5">
            <Text className="text-3xl mb-2">💗</Text>
            <Text className="text-ghost-text text-base font-bold mb-1">Vibe-check</Text>
            <Text className="text-ghost-muted text-sm leading-5">
              AI wyłapuje ton i zmiany nastroju w sekundy.
            </Text>
          </View>
          <View className="flex-1 bg-ghost-card border border-ghost-border rounded-3xl p-5">
            <Text className="text-3xl mb-2">💬</Text>
            <Text className="text-ghost-text text-base font-bold mb-1">Gotowe odpowiedzi</Text>
            <Text className="text-ghost-muted text-sm leading-5">
              Koniec zostawiania na przeczytane.
            </Text>
          </View>
        </View>

        {/* Ostatnie analizy */}
        <View className="flex-row items-center justify-between mt-8 mb-3">
          <Text className="text-ghost-text text-lg font-bold">Ostatnie rozkminy</Text>
          {history.length > 0 ? (
            <Pressable onPress={() => router.push("/history")} hitSlop={8} className="active:opacity-70">
              <Text className="text-ghost-pink text-sm font-bold">Zobacz wszystkie →</Text>
            </Pressable>
          ) : null}
        </View>

        {recent.length === 0 ? (
          <View className="bg-ghost-card border border-ghost-border rounded-3xl p-6 items-center">
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
