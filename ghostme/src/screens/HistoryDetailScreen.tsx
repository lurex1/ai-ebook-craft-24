/**
 * Pełny raport zapisanej analizy z historii:
 * tekst rozmowy, wynik analizy i propozycje odpowiedzi.
 */

import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { AnalysisReport } from "@/components/AnalysisReport";
import { GhostCard } from "@/components/GhostCard";
import { GradientBackground } from "@/components/GradientBackground";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { MatchSummary } from "@/components/MatchSummary";
import { RepliesList } from "@/components/RepliesList";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getRecord } from "@/services/storage.service";
import type { AnalysisRecord } from "@/types/analysis";
import { formatDate } from "@/utils/format";

export function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Wczytujemy rekord z AsyncStorage po identyfikatorze z adresu
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getRecord(id).then((found) => {
      setRecord(found);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <GradientBackground>
        <LoadingOverlay message="Wczytuję raport..." />
      </GradientBackground>
    );
  }

  if (!record) {
    return (
      <GradientBackground>
        <ScreenHeader title="Raport" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-4">🤔</Text>
          <Text className="text-ghost-muted text-base text-center">
            Nie znaleziono tej analizy — mogła zostać usunięta.
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScreenHeader title="Vibe Check" />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-ghost-muted text-xs mb-4">{formatDate(record.createdAt)}</Text>

        {/* Pasek dopasowania + duszek z podsumowaniem */}
        <MatchSummary percent={record.analysis.replyChance} summary={record.analysis.summary} />

        {/* Proponowane odpowiedzi */}
        <RepliesList replies={record.replies} />

        {/* Pełny raport */}
        <Text className="text-ghost-text text-lg font-bold mb-4 mt-4">🔍 Pełny raport</Text>
        <AnalysisReport analysis={record.analysis} hideChance />

        <GhostCard icon="💬" title="Analizowana rozmowa">
          <Text className="text-ghost-muted text-sm leading-6">{record.conversationText}</Text>
        </GhostCard>
      </ScrollView>
    </GradientBackground>
  );
}
