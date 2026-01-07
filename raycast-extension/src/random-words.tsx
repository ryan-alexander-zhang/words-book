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
        title: "加载失败",
        message: error instanceof Error ? error.message : "未知错误"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWords();
  }, [loadWords]);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="随机单词" navigationTitle="随机单词">
      {words.map((word) => (
        <List.Item
          key={word.id}
          title={word.name}
          icon={Icon.Shuffle}
          actions={
            <ActionPanel>
              <Action title="重新随机" icon={Icon.Repeat} onAction={loadWords} />
              <Action.CopyToClipboard title="复制单词" content={word.name} />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && words.length === 0 ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="没有单词"
          description="请先在 Words Book 中添加单词"
        />
      ) : null}
    </List>
  );
}

