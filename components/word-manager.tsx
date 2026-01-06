"use client";

import { useEffect, useMemo, useState } from "react";
import { WordForm } from "@/components/word-form";
import { WordTable } from "@/components/word-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type WordItem } from "@/lib/types";

interface WordManagerProps {
  initialWords: WordItem[];
}

type SortOrder = "desc" | "asc";

export function WordManager({ initialWords }: WordManagerProps) {
  const [words, setWords] = useState<WordItem[]>(initialWords);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [importText, setImportText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWords(initialWords);
    setSelectedIds(new Set());
  }, [initialWords]);

  const normalizeWords = (list: WordItem[]) =>
    list.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt).toISOString()
    }));

  const refreshWords = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/words");
      const data = await response.json();
      setWords(normalizeWords(data.words));
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (name: string) => {
    setError(null);
    await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    await refreshWords();
  };

  const parsedWords = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    const filtered = words.filter((word) =>
      word.name.toLowerCase().includes(trimmedQuery)
    );
    const sorted = [...filtered].sort((a, b) => {
      const first = new Date(a.createdAt).getTime();
      const second = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? second - first : first - second;
    });
    return sorted;
  }, [words, query, sortOrder]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(parsedWords.map((word) => word.id)));
  };

  const handleDeleteSelected = async () => {
    setError(null);
    if (selectedIds.size === 0) return;
    await fetch("/api/words", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) })
    });
    await refreshWords();
  };

  const handleClearAll = async () => {
    if (words.length === 0) return;
    setError(null);
    await fetch("/api/words", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true })
    });
    await refreshWords();
  };

  const parseImportWords = (text: string) => {
    const items = text
      .split(/[\n,]+/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    return Array.from(new Set(items));
  };

  const handleImport = async () => {
    setError(null);
    const names = parseImportWords(importText);
    if (names.length === 0) {
      setError("请输入至少一个单词后再导入。");
      return;
    }
    await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names })
    });
    setImportText("");
    await refreshWords();
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(parsedWords, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "words-book.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const allSelected = parsedWords.length > 0 && parsedWords.every((word) => selectedIds.has(word.id));
  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-4">
      <WordForm onAdd={handleAdd} />

      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="模糊搜索单词"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="sm:w-64"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              时间排序
              <select
                className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              >
                <option value="desc">最新在前</option>
                <option value="asc">最早在前</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport} disabled={parsedWords.length === 0}>
              导出
            </Button>
            <Button variant="outline" onClick={handleImport}>
              导入
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteSelected}
              disabled={selectedCount === 0}
            >
              删除已选（{selectedCount}）
            </Button>
            <Button variant="destructive" onClick={handleClearAll} disabled={words.length === 0}>
              清空所有
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">导入文本（逗号或换行分隔）</label>
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            className="min-h-[80px] w-full rounded-md border border-input bg-background p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="例如：apple, banana\n或多行输入"
          />
        </div>

        {loading && <p className="text-sm text-muted-foreground">Updating...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <WordTable
        words={parsedWords}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleSelectAll}
        allSelected={allSelected}
      />
    </div>
  );
}
