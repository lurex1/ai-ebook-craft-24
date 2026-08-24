/**
 * Widok błędu z przyciskiem ponownej próby.
 * Wyświetla czytelny komunikat (AiError) zamiast surowego wyjątku.
 */

import { Text, View } from "react-native";

import { GradientButton } from "./GradientButton";

interface ErrorBoxProps {
  message: string;
  /** Ponawia nieudaną operację (OCR / analiza) */
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorBox({ message, onRetry, retryLabel = "Spróbuj ponownie" }: ErrorBoxProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-5xl mb-4">😕</Text>
      <Text className="text-ghost-text text-lg font-bold text-center mb-2">Coś poszło nie tak</Text>
      <Text className="text-ghost-muted text-base text-center mb-8">{message}</Text>
      {onRetry ? <GradientButton label={retryLabel} icon="🔄" onPress={onRetry} /> : null}
    </View>
  );
}
