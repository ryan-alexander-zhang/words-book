import { Action, ActionPanel, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { fetchWords, Word } from "./lib/api";

export default function SearchWord() {
  const [isLoading, setIsLoading] = useState(true);
  const [words, setWords] = useState<Word[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWords();
        setWords(data);
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "加载失败",
          message: error instanceof Error ? error.message : "未知错误"
        });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return words;
    }
    return words.filter((word) => word.name.toLowerCase().includes(query));
  }, [searchText, words]);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="搜索单词"
      throttle
    >
      {filtered.map((word) => (
        <List.Item
          key={word.id}
          title={word.name}
          subtitle={word.createdAt ? new Date(word.createdAt).toLocaleString() : undefined}
          icon={Icon.Text}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="复制单词" content={word.name} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

