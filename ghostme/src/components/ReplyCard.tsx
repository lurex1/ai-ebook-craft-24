/**
 * Karta propozycji odpowiedzi (😂 / 😎 / ❤️) z przyciskiem Kopiuj.
 * Po skopiowaniu przycisk przez chwilę pokazuje potwierdzenie.
 */

import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

interface ReplyCardProps {
  /** Emoji kategorii, np. "😂" */
  icon: string;
  /** Nazwa kategorii, np. "Zabawna" */
  label: string;
  /** Treść proponowanej odpowiedzi */
  text: string;
}

export function ReplyCard({ icon, label, text }: ReplyCardProps) {
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
      <View className="flex-row items-center gap-2 mb-3">
        <Text className="text-2xl">{icon}</Text>
        <Text className="text-ghost-text text-base font-bold">{label}</Text>
      </View>

      <Text className="text-ghost-text text-base leading-6 mb-4">{text}</Text>

      <Pressable
        onPress={handleCopy}
        className={`self-start rounded-xl px-4 py-2 border ${
          copied ? "bg-ghost-success/20 border-ghost-success" : "bg-ghost-cardLight border-ghost-border"
        } active:opacity-70`}
      >
        <Text className={`text-sm font-bold ${copied ? "text-ghost-success" : "text-ghost-text"}`}>
          {copied ? "✓ Skopiowano" : "📋 Kopiuj"}
        </Text>
      </Pressable>
    </View>
  );
}
