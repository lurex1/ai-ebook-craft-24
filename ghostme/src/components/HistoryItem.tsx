/**
 * Element listy historii — data, skrót rozmowy i szansa na odpowiedź.
 * Kliknięcie otwiera pełny raport; długie przytrzymanie pozwala usunąć wpis.
 */

import { Pressable, Text, View } from "react-native";

import type { AnalysisRecord } from "@/types/analysis";
import { formatDate, truncate } from "@/utils/format";

interface HistoryItemProps {
  record: AnalysisRecord;
  onPress: () => void;
  onLongPress: () => void;
}

export function HistoryItem({ record, onPress, onLongPress }: HistoryItemProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="bg-ghost-card border border-ghost-border rounded-3xl p-5 mb-3 active:opacity-70"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-ghost-muted text-xs">{formatDate(record.createdAt)}</Text>
        <View className="bg-ghost-cardLight rounded-full px-3 py-1">
          <Text className="text-ghost-pink text-xs font-bold">📈 {record.analysis.replyChance}%</Text>
        </View>
      </View>
      <Text className="text-ghost-text text-base leading-6">
        {truncate(record.conversationText, 90)}
      </Text>
    </Pressable>
  );
}
