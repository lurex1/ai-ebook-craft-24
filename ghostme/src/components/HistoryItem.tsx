/**
 * Element listy historii — miniatura screena, skrót rozmowy i Match.
 * Kliknięcie otwiera pełny raport; długie przytrzymanie pozwala usunąć wpis.
 */

import { Image, Pressable, Text, View } from "react-native";

import type { AnalysisRecord } from "@/types/analysis";
import { formatRelative, truncate } from "@/utils/format";
import { LOGO_DATA_URI } from "@/utils/logo";

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
      className="flex-row bg-ghost-card border border-ghost-border rounded-3xl p-3 mb-3 active:opacity-70"
    >
      {/* Miniatura screena (albo logo, gdy brak zdjęcia) */}
      {record.imageUri ? (
        <Image
          source={{ uri: record.imageUri }}
          style={{ width: 64, height: 76, borderRadius: 16 }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="bg-ghost-cardLight items-center justify-center"
          style={{ width: 64, height: 76, borderRadius: 16 }}
        >
          <Image source={{ uri: LOGO_DATA_URI }} style={{ width: 40, height: 40 }} />
        </View>
      )}

      {/* Treść */}
      <View className="flex-1 ml-3 justify-center">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-ghost-muted text-xs">{formatRelative(record.createdAt)}</Text>
          <View className="bg-ghost-pink/20 rounded-full px-3 py-1">
            <Text className="text-ghost-pink text-xs font-bold">💗 {record.analysis.replyChance}%</Text>
          </View>
        </View>
        <Text className="text-ghost-text text-sm leading-5" numberOfLines={2}>
          {truncate(record.conversationText, 70)}
        </Text>
      </View>
    </Pressable>
  );
}
