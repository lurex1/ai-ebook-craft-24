/**
 * Główny przycisk akcji — duży, mocno zaokrąglony, z gradientem róż → fiolet
 * i delikatną różową poświatą. Obsługuje stan ładowania oraz wariant
 * drugorzędny (obrys zamiast gradientu).
 */

import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  /** Emoji/ikona po lewej stronie napisu */
  icon?: string;
  /** Pokazuje spinner i blokuje przycisk */
  loading?: boolean;
  disabled?: boolean;
  /** "secondary" = przezroczysty z obrysem, bez gradientu */
  variant?: "primary" | "secondary";
}

export function GradientButton({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  variant = "primary",
}: GradientButtonProps) {
  const isBlocked = disabled || loading;

  const content = (
    <View className="flex-row items-center justify-center gap-2 py-4 px-6">
      {loading ? (
        <ActivityIndicator color="#F4F1FF" />
      ) : (
        <>
          {icon ? <Text className="text-xl">{icon}</Text> : null}
          <Text className="text-ghost-text text-lg font-bold">{label}</Text>
        </>
      )}
    </View>
  );

  if (variant === "secondary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isBlocked}
        className={`rounded-3xl border-2 border-ghost-border bg-ghost-card active:opacity-80 ${
          isBlocked ? "opacity-50" : ""
        }`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isBlocked}
      className={`active:opacity-80 ${isBlocked ? "opacity-60" : ""}`}
      // Różowa poświata pod głównym przyciskiem (iOS: shadow, Android: elevation).
      // borderRadius na kontenerze cienia, żeby poświata miała kształt przycisku.
      style={{
        borderRadius: 24,
        shadowColor: "#FF6EC7",
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={["#FF6EC7", "#A855F7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderRadius: 24 }}
      >
        {content}
      </LinearGradient>
    </Pressable>
  );
}
