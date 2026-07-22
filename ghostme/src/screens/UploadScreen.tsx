/**
 * Upload — wybór screenshota rozmowy.
 * Galeria lub aparat, podgląd wybranego zdjęcia i przejście do OCR.
 */

import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";

import { GradientBackground } from "@/components/GradientBackground";
import { GradientButton } from "@/components/GradientButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAnalysisFlow } from "@/hooks/useAnalysisFlow";

export function UploadScreen() {
  const router = useRouter();
  const { imageUri, setImage } = useAnalysisFlow();
  const [picking, setPicking] = useState(false);

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
      Alert.alert("Błąd", "Nie udało się otworzyć galerii. Spróbuj ponownie.");
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
      Alert.alert("Błąd", "Nie udało się uruchomić aparatu. Spróbuj ponownie.");
    } finally {
      setPicking(false);
    }
  };

  return (
    <GradientBackground>
      <ScreenHeader title="Dodaj screenshot" />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="text-ghost-muted text-base mb-6">
          Dodaj screenshot rozmowy z Messengera, Instagrama, WhatsAppa lub SMS.
        </Text>

        {/* Podgląd wybranego zdjęcia lub placeholder */}
        {imageUri ? (
          <View className="bg-ghost-card border border-ghost-border rounded-3xl p-3 mb-6">
            <Image
              source={{ uri: imageUri }}
              className="w-full rounded-2xl"
              style={{ height: 380 }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View className="bg-ghost-card border-2 border-dashed border-ghost-border rounded-3xl h-64 items-center justify-center mb-6">
            <Text className="text-5xl mb-2">🖼️</Text>
            <Text className="text-ghost-muted text-sm">Tutaj pojawi się podgląd zdjęcia</Text>
          </View>
        )}

        <View className="gap-3">
          <GradientButton
            label="Wybierz z galerii"
            icon="🖼️"
            variant="secondary"
            onPress={pickFromGallery}
            loading={picking}
          />
          <GradientButton
            label="Zrób zdjęcie"
            icon="📷"
            variant="secondary"
            onPress={takePhoto}
            loading={picking}
          />
          <GradientButton
            label="Dalej"
            icon="➡️"
            onPress={() => router.push("/ocr")}
            disabled={!imageUri}
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}
