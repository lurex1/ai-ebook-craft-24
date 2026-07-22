/**
 * Podsumowanie wyniku w stylu "Vibe Check": pasek dopasowania (Match)
 * oraz duszek z różowym dymkiem z krótkim werdyktem AI.
 * Używane na ekranie wyników i w raporcie z historii.
 */

import { LinearGradient } from "expo-linear-gradient";
import { Image, Text, View } from "react-native";

import { LOGO_DATA_URI } from "@/utils/logo";

interface MatchSummaryProps {
  /** Szansa na odpowiedź 0-100 */
  percent: number;
  /** Krótkie podsumowanie analizy (tekst w dymku) */
  summary: string;
}

export function MatchSummary({ percent, summary }: MatchSummaryProps) {
  return (
    <View>
      {/* Pasek dopasowania */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-ghost-muted text-sm font-bold">Szansa na odpowiedź</Text>
        <Text className="text-ghost-pink text-sm font-bold">Match: {percent}%</Text>
      </View>
      <View className="h-3 bg-ghost-cardLight rounded-full overflow-hidden mb-6">
        <LinearGradient
          colors={["#FF4FA0", "#FF2D8D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${percent}%`, height: "100%", borderRadius: 999 }}
        />
      </View>

      {/* Duszek z dymkiem podsumowania */}
      <View className="flex-row items-start gap-3 mb-8">
        <Image source={{ uri: LOGO_DATA_URI }} style={{ width: 56, height: 56 }} />
        <View className="flex-1 bg-ghost-pink rounded-3xl rounded-tl-md px-4 py-3">
          <Text className="text-white text-sm font-bold leading-5">{summary}</Text>
        </View>
      </View>
    </View>
  );
}
