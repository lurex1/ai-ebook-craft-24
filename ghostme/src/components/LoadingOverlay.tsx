/**
 * Pełnoekranowy stan ładowania — animowany duszek, spinner i komunikat.
 * Używany podczas OCR oraz analizy AI.
 */

import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Text, View } from "react-native";

interface LoadingOverlayProps {
  /** Główny komunikat, np. "Analizuję rozmowę..." */
  message: string;
  /** Dodatkowa linia opisu (opcjonalna) */
  hint?: string;
}

export function LoadingOverlay({ message, hint }: LoadingOverlayProps) {
  // Delikatne unoszenie duszka w górę i w dół (pętla)
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -10, duration: 900, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [float]);

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.Text style={{ transform: [{ translateY: float }] }} className="text-6xl mb-6">
        👻✨
      </Animated.Text>
      <ActivityIndicator size="large" color="#FF6EC7" />
      <Text className="text-ghost-text text-lg font-bold mt-6 text-center">{message}</Text>
      {hint ? <Text className="text-ghost-muted text-sm mt-2 text-center">{hint}</Text> : null}
    </View>
  );
}
