/**
 * 📈 Pasek szansy na odpowiedź (0-100%) z animowanym wypełnieniem
 * i gradientem fiolet → niebieski.
 */

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

interface ChanceBarProps {
  /** Wartość procentowa 0-100 */
  percent: number;
}

export function ChanceBar({ percent }: ChanceBarProps) {
  const progress = useRef(new Animated.Value(0)).current;

  // Animujemy wypełnienie od 0 do wartości docelowej przy pojawieniu się
  useEffect(() => {
    Animated.timing(progress, {
      toValue: percent,
      duration: 900,
      useNativeDriver: false, // animujemy szerokość, nie transform
    }).start();
  }, [percent, progress]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View>
      <Text className="text-ghost-pink text-3xl font-bold mb-3">{percent}% ✨</Text>
      <View className="h-4 bg-ghost-cardLight rounded-full overflow-hidden">
        <Animated.View style={{ width }} className="h-full">
          <LinearGradient
            colors={["#FF6EC7", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: 999 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}
