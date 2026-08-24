/**
 * Upload — wrzucanie screena rozmowy (układ wg projektu ze Stitch).
 * Neonowa strefa uploadu, różowy pill, ostatnie wrzutki jako miniatury.
 */

import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, Text, View } from "react-native";

import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";
import { useHistory } from "@/hooks/useHistory";
import { formatRelative } from "@/utils/format";
import { LOGO_DATA_URI } from "@/utils/logo";

/** Szeryfowy krój nagłówka (spójny z Home). */
const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, 'Times New Roman', serif",
});

export function UploadScreen() {
  const router = useRouter();
  const { imageUri, setImage } = useAnalysisFlow();
  const { history } = useHistory();
  const [picking, setPicking] = useState(false);

  // Miniatury ostatnich wrzutek (rekordy ze screenshotem)
  const recentUploads = history.filter((record) => record.imageUri).slice(0, 6);

  /** Wybór zdjęcia z galerii. */
  const pickFromGallery = async () => {
    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Ups", "Nie udało się otworzyć galerii. Spróbuj jeszcze raz.");
    } finally {
      setPicking(false);
    }
  };

  /** Zrobienie zdjęcia aparatem (wymaga zgody użytkownika). */
  const takePhoto = async () => {
    setPicking(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Brak dostępu", "Aby zrobić zdjęcie, zezwól aplikacji na użycie aparatu.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Ups", "Nie udało się uruchomić aparatu. Spróbuj jeszcze raz.");
    } finally {
      setPicking(false);
    }
  };

  return (
    <GradientBackground>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Nagłówek */}
        <Text
          className="text-ghost-text text-center mt-8"
          style={{ fontFamily: SERIF, fontSize: 30, fontWeight: "700" }}
        >
          Sypnij teą ☕
        </Text>
        <Text className="text-ghost-muted text-sm text-center mt-2 mb-6 px-4 leading-5">
          Dramat czy flirt — pomożemy Ci znaleźć najlepszy comeback.
        </Text>

        {/* Strefa uploadu / podgląd wybranego screena */}
        {imageUri ? (
          <View className="bg-ghost-card border border-ghost-border rounded-[28px] p-3 mb-5">
            <Image
              source={{ uri: imageUri }}
              className="w-full rounded-3xl"
              style={{ height: 360 }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View className="border-2 border-dashed border-ghost-border rounded-[28px] items-center px-6 py-10 mb-5">
            {/* Neonowy znak z logo */}
            <Image
              source={{ uri: LOGO_DATA_URI }}
              style={{ width: 84, height: 84, marginBottom: 18 }}
            />
            <Text className="text-ghost-text text-base font-bold mb-1">Wrzuć screena tutaj</Text>
            <Text className="text-ghost-muted text-xs mb-6">Obsługuje PNG i JPG (max 10 MB)</Text>
            <GradientButton
              label="Wgraj screenshot"
              icon="⬆️"
              onPress={pickFromGallery}
              loading={picking}
            />
            <Pressable onPress={takePhoto} hitSlop={8} className="mt-4 active:opacity-70">
              <Text className="text-ghost-pink text-sm font-bold">📷 Albo zrób zdjęcie</Text>
            </Pressable>
          </View>
        )}

        {/* Po wyborze zdjęcia: zmiana + przejście dalej */}
        {imageUri ? (
          <View className="gap-3 mb-6">
            <GradientButton label="DALEJ" icon="➡️" onPress={() => router.push("/ocr")} />
            <GradientButton
              label="Wybierz inny screen"
              icon="🔄"
              variant="secondary"
              onPress={pickFromGallery}
              loading={picking}
            />
          </View>
        ) : null}

        {/* Ostatnie wrzutki */}
        {recentUploads.length > 0 ? (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-ghost-text text-lg font-bold">Ostatnie wrzutki</Text>
              <Pressable
                onPress={() => router.push("/history")}
                hitSlop={8}
                className="active:opacity-70"
              >
                <Text className="text-ghost-pink text-sm font-bold">Zobacz wszystkie →</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3">
                {recentUploads.map((record) => (
                  <Pressable
                    key={record.id}
                    onPress={() =>
                      router.push({ pathname: "/history/[id]", params: { id: record.id } })
                    }
                    className="active:opacity-70"
                  >
                    <Image
                      source={{ uri: record.imageUri! }}
                      style={{ width: 96, height: 150, borderRadius: 16 }}
                      resizeMode="cover"
                    />
                    <Text className="text-ghost-muted text-[10px] mt-1 text-center">
                      {formatRelative(record.createdAt)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </GradientBackground>
  );
}
