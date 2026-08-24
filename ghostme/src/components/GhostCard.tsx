/**
 * Zaokrąglona karta — podstawowy kontener treści w aplikacji.
 * Opcjonalny nagłówek z emoji utrzymuje spójny wygląd sekcji raportu.
 */

import { Text, View } from "react-native";

interface GhostCardProps {
  /** Emoji wyświetlane przed tytułem, np. "😊" */
  icon?: string;
  /** Tytuł sekcji, np. "Ton rozmowy" */
  title?: string;
  children: React.ReactNode;
}

export function GhostCard({ icon, title, children }: GhostCardProps) {
  return (
    <View className="bg-ghost-card border border-ghost-border rounded-3xl p-5 mb-4">
      {title ? (
        <View className="flex-row items-center gap-2 mb-3">
          {icon ? <Text className="text-xl">{icon}</Text> : null}
          <Text className="text-ghost-text text-base font-bold">{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}
