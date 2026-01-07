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
          title: "Load failed",
          message: error instanceof Error ? error.message : "Unknown error"
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
      searchBarPlaceholder="Search words"
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
              <Action.CopyToClipboard title="Copy word" content={word.name} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
