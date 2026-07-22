/**
 * Główny przycisk akcji — duży, zaokrąglony, z gradientem fiolet → niebieski.
 * Obsługuje stan ładowania oraz wariant drugorzędny (obrys zamiast gradientu).
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
        className={`rounded-2xl border-2 border-ghost-border bg-ghost-card active:opacity-80 ${
          isBlocked ? "opacity-50" : ""
        }`}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} disabled={isBlocked} className={`active:opacity-80 ${isBlocked ? "opacity-60" : ""}`}>
      <LinearGradient
        colors={["#8B5CF6", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="rounded-2xl"
        style={{ borderRadius: 16 }}
      >
        {content}
      </LinearGradient>
    </Pressable>
  );
}
