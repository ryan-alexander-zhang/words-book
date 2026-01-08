"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type TextItem } from "@/lib/types";

interface TextCardViewProps {
  items: TextItem[];
  label: string;
}

const pickRandomItems = (list: TextItem[], count: number) =>
  [...list].sort(() => Math.random() - 0.5).slice(0, count);

export function TextCardView({ items, label }: TextCardViewProps) {
  const [maxCards, setMaxCards] = useState(5);
  const [selection, setSelection] = useState<TextItem[]>([]);

  const cappedMax = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.min(Math.max(maxCards, 1), items.length);
  }, [maxCards, items.length]);

  useEffect(() => {
    setSelection(pickRandomItems(items, cappedMax));
  }, [items, cappedMax]);

  const handleShuffle = () => {
    setSelection(pickRandomItems(items, cappedMax));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <span>{items.length} {label} total</span>
          <p>Adjust the count and shuffle to refresh the set.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            Max cards
            <input
              type="number"
              min={items.length === 0 ? 0 : 1}
              max={Math.max(items.length, 1)}
              value={items.length === 0 ? 0 : maxCards}
              onChange={(event) => setMaxCards(Number(event.target.value))}
              className="h-9 w-20 rounded-md border border-input bg-background px-2 text-sm"
            />
          </label>
          <Button variant="outline" onClick={handleShuffle} disabled={items.length === 0}>
            Shuffle
          </Button>
        </div>
      </div>

      {selection.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No {label} to display yet. Add some first.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {selection.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-lg">{item.content}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Added: {new Date(item.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
