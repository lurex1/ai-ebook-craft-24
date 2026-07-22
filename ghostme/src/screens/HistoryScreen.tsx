/**
 * History — lista wszystkich wcześniejszych analiz.
 * Kliknięcie otwiera pełny raport, długie przytrzymanie usuwa wpis.
 */

import { useRouter } from "expo-router";
import { Alert, FlatList, Text, View } from "react-native";

import { GradientBackground } from "@/components/GradientBackground";
import { HistoryItem } from "@/components/HistoryItem";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useHistory } from "@/hooks/useHistory";

export function HistoryScreen() {
  const router = useRouter();
  const { history, loading, removeRecord } = useHistory();

  /** Potwierdzenie przed usunięciem pojedynczego wpisu. */
  const confirmDelete = (id: string) => {
    Alert.alert("Usunąć analizę?", "Tej operacji nie można cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      { text: "Usuń", style: "destructive", onPress: () => removeRecord(id) },
    ]);
  };

  return (
    <GradientBackground>
      <ScreenHeader title="Historia analiz" />
      <FlatList
        data={history}
        keyExtractor={(record) => record.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 }}
        renderItem={({ item }) => (
          <HistoryItem
            record={item}
            onPress={() => router.push({ pathname: "/history/[id]", params: { id: item.id } })}
            onLongPress={() => confirmDelete(item.id)}
          />
        )}
        ListHeaderComponent={
          history.length > 0 ? (
            <Text className="text-ghost-muted text-sm mb-4">
              Przytrzymaj wpis, aby go usunąć.
            </Text>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-5xl mb-4">🗂️</Text>
              <Text className="text-ghost-text text-lg font-bold mb-2">Brak historii</Text>
              <Text className="text-ghost-muted text-base text-center">
                Twoje przeanalizowane rozmowy pojawią się tutaj.
              </Text>
            </View>
          ) : null
        }
      />
    </GradientBackground>
  );
}
