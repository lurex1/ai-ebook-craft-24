/**
 * Karta propozycji odpowiedzi (układ wg projektu ze Stitch):
 * różowy tag stylu, prawostronna etykieta, cytat i pill "Kopiuj".
 */

import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

interface ReplyCardProps {
  /** Nazwa stylu odpowiedzi, np. "Zabawna" (różowy tag) */
  tag: string;
  /** Krótka etykieta charakteru, np. "Pewniak" */
  badge: string;
  /** Treść proponowanej odpowiedzi */
  text: string;
}

export function ReplyCard({ tag, badge, text }: ReplyCardProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sprzątamy timer przy odmontowaniu komponentu
  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    resetTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="bg-ghost-card border border-ghost-border rounded-3xl p-5 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="bg-ghost-pink/20 rounded-full px-3 py-1">
          <Text className="text-ghost-pink text-xs font-bold">{tag}</Text>
        </View>
        <Text className="text-ghost-muted text-xs italic font-bold">{badge}</Text>
      </View>

      <Text className="text-ghost-text text-base leading-6 mb-4">„{text}"</Text>

      <Pressable
        onPress={handleCopy}
        className={`self-end rounded-full px-5 py-2 ${
          copied ? "bg-ghost-success" : "bg-ghost-pink"
        } active:opacity-80`}
      >
        <Text className="text-white text-sm font-bold">
          {copied ? "✓ Skopiowano" : "📋 Kopiuj"}
        </Text>
      </Pressable>
    </View>
  );
}
