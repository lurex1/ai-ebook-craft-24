/**
 * Settings — tryb ciemny, czyszczenie historii i informacje o aplikacji.
 */

import Constants from "expo-constants";
import { Alert, Image, ScrollView, Switch, Text, View } from "react-native";

import { GhostCard } from "@/components/GhostCard";
import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useHistory } from "@/hooks/useHistory";
import { AI_CONFIG, isDemoMode } from "@/services/config";
import { clearHistory } from "@/services/storage.service";
import { LOGO_DATA_URI } from "@/utils/logo";

export function SettingsScreen() {
  const { darkMode, toggleDarkMode } = useAppTheme();
  const { history } = useHistory();

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
      <ScreenHeader title="Profil" hideBack />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Nagłówek profilu — awatar-duszek i licznik rozkmin */}
        <View className="items-center mb-6 mt-2">
          <View
            className="rounded-full bg-ghost-card border-2 border-ghost-pink items-center justify-center"
            style={{
              width: 110,
              height: 110,
              shadowColor: "#FF2D8D",
              shadowOpacity: 0.5,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
              elevation: 8,
            }}
          >
            <Image source={{ uri: LOGO_DATA_URI }} style={{ width: 72, height: 72 }} />
          </View>
          <Text className="text-ghost-text text-xl font-bold mt-4">Ghost 👻</Text>
          <View className="bg-ghost-pink/20 rounded-full px-4 py-1 mt-2">
            <Text className="text-ghost-pink text-sm font-bold">
              {history.length} {history.length === 1 ? "rozkmina" : "rozkmin"} 🔮
            </Text>
          </View>
        </View>

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
