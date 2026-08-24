/**
 * Lista trzech proponowanych odpowiedzi (😂 zabawna, 😎 pewna siebie, ❤️ miła)
 * w kartach w stylu "Vibe Check". Współdzielona przez ekran wyników i historię.
 */

import { Text, View } from "react-native";

import type { SuggestedReplies } from "@/types/analysis";
import { ReplyCard } from "./ReplyCard";

interface RepliesListProps {
  replies: SuggestedReplies;
}

export function RepliesList({ replies }: RepliesListProps) {
  return (
    <View>
      <Text className="text-ghost-text text-lg font-bold mb-4">✨ Proponowane odpowiedzi</Text>
      <ReplyCard tag="😂 Zabawna" badge="Pewniak" text={replies.funny} />
      <ReplyCard tag="😎 Pewna siebie" badge="Mocne wejście" text={replies.confident} />
      <ReplyCard tag="❤️ Miła" badge="Bezpieczny wybór" text={replies.kind} />
    </View>
  );
}
