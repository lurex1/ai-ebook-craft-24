/**
 * Główny layout aplikacji — stack Expo Router owinięty w providery:
 * motyw (tryb ciemny) oraz stan przepływu analizy.
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import "../global.css";
import { AnalysisFlowProvider } from "@/hooks/useAnalysisFlow";
import { AppThemeProvider } from "@/hooks/useAppTheme";

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AnalysisFlowProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false, // używamy własnego nagłówka (ScreenHeader)
            contentStyle: { backgroundColor: "#0B0716" },
            animation: "slide_from_right",
          }}
        />
      </AnalysisFlowProvider>
    </AppThemeProvider>
  );
}
