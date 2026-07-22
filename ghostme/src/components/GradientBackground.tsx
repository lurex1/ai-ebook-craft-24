/**
 * Tło ekranu — śliwkowa noc z delikatnym różowym poblaskiem
 * + bezpieczne marginesy (notch, pasek systemowy).
 */

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

interface GradientBackgroundProps {
  children: React.ReactNode;
}

export function GradientBackground({ children }: GradientBackgroundProps) {
  return (
    <LinearGradient
      colors={["#33104F", "#1B0B2E", "#2E0F3D"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">{children}</SafeAreaView>
    </LinearGradient>
  );
}
