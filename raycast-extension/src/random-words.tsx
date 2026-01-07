import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useCallback, useEffect, useState } from "react";
import { fetchWords, getRandomCount, Word } from "./lib/api";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function RandomWords() {
  const [isLoading, setIsLoading] = useState(true);
  const [words, setWords] = useState<Word[]>([]);

  const loadWords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchWords();
      const count = getRandomCount();
      setWords(shuffle(data).slice(0, count));
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Load failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWords();
  }, [loadWords]);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Random words" navigationTitle="Random words">
      {words.map((word) => (
        <List.Item
          key={word.id}
          title={word.name}
          icon={Icon.Shuffle}
          actions={
            <ActionPanel>
              <Action title="Reshuffle" icon={Icon.Repeat} onAction={loadWords} />
              <Action.CopyToClipboard title="Copy word" content={word.name} />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && words.length === 0 ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="No words"
          description="Add words in Words Book first"
        />
      ) : null}
    </List>
  );
}
