/**
 * Dolny pasek zakładek (wg projektu ze Stitch):
 * Start · Wrzuć · Historia · Profil.
 * Ekrany przepływu analizy (OCR, raport, odpowiedzi) pozostają w stacku
 * nad zakładkami — otwierają się na pełnym ekranie.
 */

import { Tabs } from "expo-router";
import { Text } from "react-native";

/** Ikona zakładki — emoji przygaszane, gdy zakładka nieaktywna. */
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#22102F",
          borderTopColor: "#4A2A75",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#FF2D8D",
        tabBarInactiveTintColor: "#C9A8E8",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Start",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👻" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Wrzuć",
          tabBarIcon: ({ focused }) => <TabIcon emoji="✨" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historia",
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => <TabIcon emoji="❤️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
