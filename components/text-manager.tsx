"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TextForm } from "@/components/text-form";
import { TextTable } from "@/components/text-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type TextItem } from "@/lib/types";
import { Download, Upload } from "lucide-react";

interface TextManagerProps {
  initialItems: TextItem[];
  apiPath: string;
  singularLabel: string;
  pluralLabel: string;
  placeholder: string;
  annotationPlaceholder: string;
  exportFileName: string;
}

type SortOrder = "desc" | "asc";

export function TextManager({
  initialItems,
  apiPath,
  singularLabel,
  pluralLabel,
  placeholder,
  annotationPlaceholder,
  exportFileName
}: TextManagerProps) {
  const [items, setItems] = useState<TextItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setSelectedIds(new Set());
    setCurrentPage(1);
  }, [initialItems]);

  const normalizeItems = (list: TextItem[]) =>
    list.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt).toISOString()
    }));

  const refreshItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiPath);
      const data = await response.json();
      setItems(normalizeItems(data.items));
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (content: string, annotation: string) => {
    setError(null);
    await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, annotation })
    });
    await refreshItems();
  };

  const handleUpdate = async (id: number, content: string, annotation: string) => {
    if (!content.trim()) {
      setError(`${singularLabel} text is required.`);
      return false;
    }
    setError(null);
    const response = await fetch(apiPath, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content, annotation })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? `Failed to update ${singularLabel.toLowerCase()}.`);
      return false;
    }
    await refreshItems();
    return true;
  };

  const parsedItems = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const contentMatch = item.content.toLowerCase().includes(trimmedQuery);
      const annotationMatch = item.annotation.toLowerCase().includes(trimmedQuery);
      return contentMatch || annotationMatch;
    });
    const sorted = [...filtered].sort((a, b) => {
      const first = new Date(a.createdAt).getTime();
      const second = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? second - first : first - second;
    });
    return sorted;
  }, [items, query, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, sortOrder, pageSize, items.length]);

  const totalPages = Math.max(1, Math.ceil(parsedItems.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return parsedItems.slice(start, start + pageSize);
  }, [parsedItems, pageSize, safePage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
    setSelectedIds(new Set(parsedItems.map((item) => item.id)));
  };

  const handleDeleteSelected = async () => {
    setError(null);
    if (selectedIds.size === 0) return;
    await fetch(apiPath, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) })
    });
    await refreshItems();
  };

  const handleClearAll = async () => {
    if (items.length === 0) return;
    setError(null);
    await fetch(apiPath, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true })
    });
    await refreshItems();
  };

  const extractItems = (payload: unknown) => {
    const list = Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object" && "items" in payload
        ? (payload as { items: unknown[] }).items
        : [];
    return list
      .map((item) => {
        if (typeof item === "string") {
          return { content: item, annotation: "" };
        }
        if (item && typeof item === "object" && "content" in item) {
          const record = item as { content?: string; annotation?: string };
          return {
            content: record.content ?? "",
            annotation: record.annotation ?? ""
          };
        }
        return { content: "", annotation: "" };
      })
      .map((item) => ({
        content: item.content.trim(),
        annotation: item.annotation.trim()
      }))
      .filter((item) => item.content);
  };

  const handleImport = async (file: File) => {
    setError(null);
    let payload: unknown;
    try {
      const text = await file.text();
      payload = JSON.parse(text);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Unable to read the file.");
      return;
    }
    const extracted = extractItems(payload);
    const existing = new Set(items.map((item) => item.content.toLowerCase()));
    const uniqueItems = extracted.filter(
      (item, index, self) =>
        index ===
          self.findIndex((candidate) => candidate.content === item.content) &&
        !existing.has(item.content.toLowerCase())
    );
    if (uniqueItems.length === 0) {
      setError(`No new ${pluralLabel.toLowerCase()} to import.`);
      return;
    }
    await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: uniqueItems })
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    await refreshItems();
  };

  const handleImportClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(parsedItems, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportFileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const allSelected = parsedItems.length > 0 && parsedItems.every((item) => selectedIds.has(item.id));
  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-4">
      <TextForm
        placeholder={placeholder}
        annotationPlaceholder={annotationPlaceholder}
        buttonLabel={`Add ${singularLabel}`}
        onAdd={handleAdd}
      />

      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder={`Search ${pluralLabel.toLowerCase()}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="sm:w-64"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Sort by time
              <select
                className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport} disabled={parsedItems.length === 0}>
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Export</span>
            </Button>
            <Button variant="outline" onClick={handleImportClick}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Import</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteSelected}
              disabled={selectedCount === 0}
            >
              Delete selected ({selectedCount})
            </Button>
            <Button variant="destructive" onClick={handleClearAll} disabled={items.length === 0}>
              Clear all
            </Button>
          </div>
        </div>

        <Input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void handleImport(file);
          }}
        />

        {loading && <p className="text-sm text-muted-foreground">Updating...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex flex-col gap-2 rounded-lg border p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            {parsedItems.length} {pluralLabel.toLowerCase()} total, page {safePage} of {totalPages}
          </span>
          <label className="flex items-center gap-2">
            Per page
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              {[10, 20, 30, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            items
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <TextTable
        items={pagedItems}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleSelectAll}
        allSelected={allSelected}
        onUpdate={handleUpdate}
        emptyMessage={`No ${pluralLabel.toLowerCase()} found. Add a new ${singularLabel.toLowerCase()} or adjust the filters.`}
      />
    </div>
  );
}
