"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WordFormProps {
  onAdd: (name: string) => Promise<void>;
}

export function WordForm({ onAdd }: WordFormProps) {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!word.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onAdd(word.trim());
      setWord("");
    } catch (err) {
      console.error(err);
      setError("Failed to add word. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:flex-row">
      <div className="flex-1">
        <Input
          placeholder="Enter a new word"
          value={word}
          onChange={(event) => setWord(event.target.value)}
          required
          minLength={1}
        />
      </div>
      <Button type="submit" disabled={loading} className="sm:w-32">
        {loading ? "Saving..." : "Add Word"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
