/**
 * Nagłówek ekranu — przycisk wstecz i tytuł.
 * Używany zamiast domyślnego nagłówka stacka (mamy własny gradientowy styl).
 */

import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

interface ScreenHeaderProps {
  title: string;
  /** Ukrywa strzałkę wstecz (np. na Home) */
  hideBack?: boolean;
}

export function ScreenHeader({ title, hideBack = false }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center px-5 py-4">
      {!hideBack ? (
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full bg-ghost-card border border-ghost-border items-center justify-center mr-3 active:opacity-70"
        >
          <Text className="text-ghost-text text-lg">←</Text>
        </Pressable>
      ) : null}
      <Text className="text-ghost-text text-xl font-bold flex-1">{title}</Text>
    </View>
  );
}
