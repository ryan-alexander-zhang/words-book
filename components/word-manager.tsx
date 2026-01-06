"use client";

import { useEffect, useState } from "react";
import type { Word } from "@prisma/client";
import { WordForm } from "@/components/word-form";
import { WordTable } from "@/components/word-table";

interface WordManagerProps {
  initialWords: Word[];
}

export function WordManager({ initialWords }: WordManagerProps) {
  const [words, setWords] = useState<Word[]>(initialWords);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setWords(initialWords);
  }, [initialWords]);

  const refreshWords = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/words");
      const data = await response.json();
      setWords(data.words);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (name: string) => {
    await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    await refreshWords();
  };

  return (
    <div className="space-y-4">
      <WordForm onAdd={handleAdd} />
      {loading && <p className="text-sm text-muted-foreground">Updating...</p>}
      <WordTable words={words} />
    </div>
  );
}
