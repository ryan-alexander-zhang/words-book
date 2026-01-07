"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WORD_LINKS, resolveHref } from "@/lib/word-links";
import { type WordItem } from "@/lib/types";

interface WordCardViewProps {
  words: WordItem[];
}

const DEFAULT_CARD_LIMIT = 20;

const pickRandomWords = (list: WordItem[], count: number) => {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy.slice(0, count);
};

export function WordCardView({ words }: WordCardViewProps) {
  const [maxCards, setMaxCards] = useState(DEFAULT_CARD_LIMIT);
  const [selection, setSelection] = useState<WordItem[]>([]);

  const cappedMax = useMemo(() => {
    if (words.length === 0) return 0;
    return Math.min(Math.max(maxCards, 1), words.length);
  }, [maxCards, words.length]);

  useEffect(() => {
    if (cappedMax === 0) {
      setSelection([]);
      return;
    }
    setSelection(pickRandomWords(words, cappedMax));
  }, [words, cappedMax]);

  const handleShuffle = () => {
    if (cappedMax === 0) return;
    setSelection(pickRandomWords(words, cappedMax));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span>共 {words.length} 个单词</span>
          <label className="flex items-center gap-2">
            最大卡片数
            <Input
              type="number"
              min={words.length === 0 ? 0 : 1}
              max={Math.max(words.length, 1)}
              value={words.length === 0 ? 0 : maxCards}
              onChange={(event) => {
                const value = Number(event.target.value);
                setMaxCards(Number.isNaN(value) ? 0 : value);
              }}
              className="h-9 w-24"
              disabled={words.length === 0}
            />
          </label>
        </div>
        <Button variant="outline" onClick={handleShuffle} disabled={cappedMax === 0}>
          换一批
        </Button>
      </div>

      {selection.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无单词可展示，请先添加。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {selection.map((word) => (
            <Card key={word.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg capitalize">{word.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  添加时间：{new Date(word.createdAt).toLocaleString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {WORD_LINKS.map((item) => (
                    <a
                      key={item.label}
                      className="text-xs text-primary underline underline-offset-4"
                      href={resolveHref(item.href, word.name)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
