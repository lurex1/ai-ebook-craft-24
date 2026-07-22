/**
 * Settings — tryb ciemny, czyszczenie historii i informacje o aplikacji.
 */

import Constants from "expo-constants";
import { Alert, ScrollView, Switch, Text, View } from "react-native";

import { GhostCard } from "@/components/GhostCard";
import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import { AI_CONFIG, isDemoMode } from "@/services/config";
import { clearHistory } from "@/services/storage.service";

export function SettingsScreen() {
  const { darkMode, toggleDarkMode } = useAppTheme();

  /** Czyszczenie historii z potwierdzeniem. */
  const confirmClearHistory = () => {
    Alert.alert("Usunąć całą historię?", "Wszystkie zapisane analizy zostaną trwale usunięte.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń wszystko",
        style: "destructive",
        onPress: async () => {
          await clearHistory();
          Alert.alert("Gotowe", "Historia została wyczyszczona.");
        },
      },
    ]);
  };

  return (
    <GradientBackground>
      <ScreenHeader title="Profil i ustawienia" hideBack />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Wygląd */}
        <GhostCard icon="🎨" title="Wygląd">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-ghost-text text-base font-bold">Tryb ciemny</Text>
              <Text className="text-ghost-muted text-sm mt-1">
                GhostTalk został zaprojektowany z myślą o ciemnym motywie.
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#4A2A75", true: "#FF2D8D" }}
              thumbColor="#F4F1FF"
            />
          </View>
        </GhostCard>

        {/* Dane */}
        <GhostCard icon="🗑️" title="Dane">
          <Text className="text-ghost-muted text-sm mb-4">
            Historia analiz jest przechowywana wyłącznie lokalnie na Twoim urządzeniu.
          </Text>
          <GradientButton
            label="Usuń całą historię"
            icon="🗑️"
            variant="secondary"
            onPress={confirmClearHistory}
          />
        </GhostCard>

        {/* Informacje o aplikacji */}
        <GhostCard icon="👻" title="O aplikacji">
          <View className="gap-2">
            <InfoRow label="Nazwa" value="GhostTalk" />
            <InfoRow label="Wersja" value={Constants.expoConfig?.version ?? "1.0.0"} />
            <InfoRow label="Model AI" value={isDemoMode() ? "Tryb demo (dane testowe)" : AI_CONFIG.model} />
          </View>
          <Text className="text-ghost-muted text-sm mt-4 leading-6">
            GhostTalk analizuje screenshoty rozmów z komunikatorów i podpowiada, co odpisać. Analiza
            AI ma charakter pomocniczy — ostateczna decyzja zawsze należy do Ciebie 💜
          </Text>
        </GhostCard>
      </ScrollView>
    </GradientBackground>
  );
}

/** Pojedynczy wiersz informacji: etykieta + wartość. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-ghost-muted text-sm">{label}</Text>
      <Text className="text-ghost-text text-sm font-bold">{value}</Text>
    </View>
  );
}
