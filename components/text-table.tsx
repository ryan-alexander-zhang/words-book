"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type TextItem } from "@/lib/types";

interface TextTableProps {
  items: TextItem[];
  selectedIds: Set<number>;
  allSelected: boolean;
  onToggleSelect: (id: number) => void;
  onToggleAll: (checked: boolean) => void;
  onUpdate: (id: number, content: string) => Promise<boolean>;
  emptyMessage: string;
}

export function TextTable({
  items,
  selectedIds,
  allSelected,
  onToggleSelect,
  onToggleAll,
  onUpdate,
  emptyMessage
}: TextTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const startEdit = (item: TextItem) => {
    setEditingId(item.id);
    setDraft(item.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  const handleSave = async (item: TextItem) => {
    if (savingId) return;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === item.content) {
      cancelEdit();
      return;
    }
    setSavingId(item.id);
    const success = await onUpdate(item.id, trimmed);
    setSavingId(null);
    if (success) {
      cancelEdit();
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allSelected}
                onChange={(event) => onToggleAll(event.target.checked)}
              />
            </TableHead>
            <TableHead>Text</TableHead>
            <TableHead className="w-48">Added</TableHead>
            <TableHead className="w-56">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.content}`}
                    checked={selectedIds.has(item.id)}
                    onChange={() => onToggleSelect(item.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {isEditing ? (
                    <Input
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void handleSave(item);
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelEdit();
                        }
                      }}
                    />
                  ) : (
                    item.content
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => void handleSave(item)}
                          disabled={savingId === item.id}
                        >
                          {savingId === item.id ? "Saving..." : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
