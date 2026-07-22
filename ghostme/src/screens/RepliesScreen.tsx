/**
 * Suggested Replies — trzy propozycje odpowiedzi wygenerowane przez AI:
 * 😂 zabawna, 😎 pewna siebie, ❤️ miła. Każdą można skopiować.
 */

import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { ReplyCard } from "@/components/ReplyCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";

export function RepliesScreen() {
  const router = useRouter();
  const { record, reset } = useAnalysisFlow();

  // Zabezpieczenie: bez wyniku analizy nie mamy czego pokazać
  if (!record) {
    return (
      <GradientBackground>
        <ScreenHeader title="Propozycje odpowiedzi" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-ghost-muted text-base text-center mb-6">
            Najpierw przeanalizuj rozmowę, aby zobaczyć propozycje odpowiedzi.
          </Text>
          <GradientButton label="Wróć do analizy" icon="←" onPress={() => router.back()} />
        </View>
      </GradientBackground>
    );
  }

  const finishFlow = () => {
    reset();
    router.dismissAll(); // wracamy na sam początek stacka (Home)
  };

  return (
    <GradientBackground>
      <ScreenHeader title="Propozycje odpowiedzi" />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-ghost-muted text-base mb-5">
          Wybierz styl, który najlepiej do Ciebie pasuje, i skopiuj gotową odpowiedź.
        </Text>

        <ReplyCard icon="😂" label="Zabawna" text={record.replies.funny} />
        <ReplyCard icon="😎" label="Pewna siebie" text={record.replies.confident} />
        <ReplyCard icon="❤️" label="Miła" text={record.replies.kind} />

        <View className="mt-2">
          <GradientButton label="Zakończ i wróć do Home" icon="🏠" onPress={finishFlow} />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
