/**
 * Lista flag (🚩 red / ✅ green) — punktowane wnioski z analizy.
 */

import { Text, View } from "react-native";

interface FlagListProps {
  items: string[];
  /** Kolorystyka i ikona punktora */
  variant: "red" | "green";
  /** Tekst pokazywany, gdy lista jest pusta */
  emptyText: string;
}

export function FlagList({ items, variant, emptyText }: FlagListProps) {
  if (items.length === 0) {
    return <Text className="text-ghost-muted text-base">{emptyText}</Text>;
  }

  return (
    <View className="gap-2">
      {items.map((item, index) => (
        <View key={index} className="flex-row gap-2">
          <Text className="text-base">{variant === "red" ? "🚩" : "✅"}</Text>
          <Text
            className={`flex-1 text-base leading-6 ${
              variant === "red" ? "text-ghost-danger" : "text-ghost-success"
            }`}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}
