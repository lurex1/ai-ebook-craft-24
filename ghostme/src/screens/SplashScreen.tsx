/**
 * Splash Screen — logo GhostMe z animacją (fade + scale),
 * po ~2 sekundach automatyczne przejście do Home.
 */

import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

import { GradientBackground } from "@/components/GradientBackground";

export function SplashScreen() {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Płynne pojawienie się logo
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    // Automatyczne przejście do Home (replace — bez powrotu do splasha)
    const timer = setTimeout(() => router.replace("/home"), 2200);
    return () => clearTimeout(timer);
  }, [opacity, scale, router]);

  return (
    <GradientBackground>
      <View className="flex-1 items-center justify-center">
        <Animated.View style={{ opacity, transform: [{ scale }] }} className="items-center">
          <Text className="text-8xl mb-4">👻</Text>
          <Text className="text-ghost-text text-4xl font-bold">GhostMe</Text>
          <Text className="text-ghost-muted text-base mt-2">Rozkminimy każdą rozmowę ✨</Text>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}
