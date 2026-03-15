"use client";

import {
  type CSSProperties,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload
} from "lucide-react";
import { PronounceWidget, type PronounceAccent } from "@/components/pronounce-widget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type WordItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WORD_LINKS, resolveHref } from "@/lib/word-links";

interface WordManagerProps {
  initialWords: WordItem[];
}

type SortOrder = "desc" | "asc";
type FeedbackTone = "error" | "info";

const DECK_SIZE = 12;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto"
});

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6D2B79F5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWords(words: WordItem[], salt = 0) {
  const copy = [...words];
  const seed = words.reduce(
    (current, word, index) => current ^ Math.imul(word.id + index + 1, 2654435761),
    Math.imul(salt + 1, 2246822519)
  );
  const random = createSeededRandom(seed);

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function normalizeWords(list: WordItem[]) {
  return list.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt).toISOString()
  }));
}

function formatRelativeTime(timestamp: string) {
  const deltaSeconds = Math.round((new Date(timestamp).getTime() - Date.now()) / 1000);

  if (Math.abs(deltaSeconds) < 60) {
    return relativeTimeFormatter.format(deltaSeconds, "second");
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) {
    return relativeTimeFormatter.format(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return relativeTimeFormatter.format(deltaHours, "hour");
  }

  const deltaDays = Math.round(deltaHours / 24);
  if (Math.abs(deltaDays) < 30) {
    return relativeTimeFormatter.format(deltaDays, "day");
  }

  const deltaMonths = Math.round(deltaDays / 30);
  if (Math.abs(deltaMonths) < 12) {
    return relativeTimeFormatter.format(deltaMonths, "month");
  }

  return relativeTimeFormatter.format(Math.round(deltaMonths / 12), "year");
}

function formatTimestamp(timestamp: string) {
  return dateFormatter.format(new Date(timestamp));
}

function formatExportTimestamp(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("-");
}

async function readErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? `Request failed (${response.status})`;
}

function extractNames(payload: unknown) {
  const list = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && "words" in payload
      ? (payload as { words: unknown[] }).words
      : [];

  return list
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in item) {
        return (item as { name?: string }).name ?? "";
      }
      return "";
    })
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getCardStyle(wordId: number, index: number) {
  const rotations = [-2, 1, -1, 2, -2, 1, 2, -1];
  const rotation = rotations[(wordId + index) % rotations.length];
  const duration = 11 + ((wordId + index) % 5) * 2;
  const delay = ((wordId + index) % 6) * 0.3;

  return {
    "--card-rotate": `${rotation}deg`,
    "--drift-duration": `${duration}s`,
    "--card-delay": `${delay}s`
  } as CSSProperties;
}

export function WordManager({ initialWords }: WordManagerProps) {
  const [words, setWords] = useState<WordItem[]>(initialWords);
  const [draftWord, setDraftWord] = useState("");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; message: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activeWordId, setActiveWordId] = useState<number | null>(initialWords[0]?.id ?? null);
  const [deckCursor, setDeckCursor] = useState(0);
  const [deckVersion, setDeckVersion] = useState(0);
  const [accent, setAccent] = useState<PronounceAccent>("us");
  const [copiedWordId, setCopiedWordId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasInitializedDeck = useRef(false);

  useEffect(() => {
    setWords(initialWords);
    setActiveWordId(initialWords[0]?.id ?? null);
    setSelectedIds(new Set());
    setDeckCursor(0);
    setDeckVersion(0);
  }, [initialWords]);

  useEffect(() => {
    if (!copiedWordId) return;
    const timeout = window.setTimeout(() => setCopiedWordId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedWordId]);

  const filteredWords = useMemo(() => {
    const trimmedQuery = deferredQuery.trim().toLowerCase();
    const filtered = trimmedQuery
      ? words.filter((word) => word.name.toLowerCase().includes(trimmedQuery))
      : words;

    return [...filtered].sort((first, second) => {
      const left = new Date(first.createdAt).getTime();
      const right = new Date(second.createdAt).getTime();
      return sortOrder === "desc" ? right - left : left - right;
    });
  }, [deferredQuery, sortOrder, words]);

  useEffect(() => {
    setSelectedIds((previous) => {
      const next = new Set(
        Array.from(previous).filter((id) => filteredWords.some((word) => word.id === id))
      );
      return next.size === previous.size ? previous : next;
    });
    setDeckCursor(0);
    if (!hasInitializedDeck.current) {
      hasInitializedDeck.current = true;
      return;
    }
    setDeckVersion((previous) => previous + 1);
  }, [filteredWords]);

  const deckWords = useMemo(
    () => shuffleWords(filteredWords, deckVersion),
    [filteredWords, deckVersion]
  );

  const visibleDeck = useMemo(() => {
    if (deckWords.length <= DECK_SIZE) {
      return deckWords;
    }
    return deckWords.slice(deckCursor, deckCursor + DECK_SIZE);
  }, [deckCursor, deckWords]);

  useEffect(() => {
    if (filteredWords.length === 0) {
      setActiveWordId(null);
      return;
    }

    if (activeWordId && filteredWords.some((word) => word.id === activeWordId)) {
      return;
    }

    setActiveWordId(visibleDeck[0]?.id ?? filteredWords[0]?.id ?? null);
  }, [activeWordId, filteredWords, visibleDeck]);

  const activeWord = filteredWords.find((word) => word.id === activeWordId) ?? null;
  const selectedCount = selectedIds.size;
  const deckCount = visibleDeck.length;
  const deckIndex = filteredWords.length === 0 ? 0 : Math.floor(deckCursor / DECK_SIZE) + 1;
  const deckTotal = Math.max(1, Math.ceil(filteredWords.length / DECK_SIZE));

  const refreshWords = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/words", {
        cache: "no-store"
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as { words?: WordItem[] };
      const nextWords = normalizeWords(data.words ?? []);
      setWords(nextWords);
      setSelectedIds((previous) => {
        const next = new Set(
          Array.from(previous).filter((id) => nextWords.some((word) => word.id === id))
        );
        return next;
      });
      setActiveWordId((previous) => {
        if (previous && nextWords.some((word) => word.id === previous)) {
          return previous;
        }
        return nextWords[0]?.id ?? null;
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to refresh words."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draftWord.trim();
    if (!trimmed) return;

    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed })
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setDraftWord("");
      await refreshWords();
    } catch (error) {
      setLoading(false);
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to add the word."
      });
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/words", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setSelectedIds(new Set());
      await refreshWords();
    } catch (error) {
      setLoading(false);
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to delete the selected words."
      });
    }
  };

  const handleDeleteWord = async (wordId: number) => {
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/words", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [wordId] })
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setSelectedIds((previous) => {
        const next = new Set(previous);
        next.delete(wordId);
        return next;
      });
      await refreshWords();
    } catch (error) {
      setLoading(false);
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to delete the word."
      });
    }
  };

  const handleClearAll = async () => {
    if (words.length === 0) return;

    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/words", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setSelectedIds(new Set());
      await refreshWords();
    } catch (error) {
      setLoading(false);
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to clear the shelf."
      });
    }
  };

  const handleImport = async (file: File) => {
    setLoading(true);
    setFeedback(null);

    try {
      const payload = JSON.parse(await file.text()) as unknown;
      const names = extractNames(payload);
      const existing = new Set(words.map((word) => word.name.toLowerCase()));
      const uniqueNames = Array.from(new Set(names)).filter((name) => !existing.has(name));

      if (uniqueNames.length === 0) {
        setFeedback({
          tone: "info",
          message: "No new words were found in that file."
        });
        setLoading(false);
        return;
      }

      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names: uniqueNames })
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await refreshWords();
    } catch (error) {
      setLoading(false);
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to import that file."
      });
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(filteredWords, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `words-${formatExportTimestamp(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async (word: WordItem) => {
    try {
      await navigator.clipboard.writeText(word.name);
      setCopiedWordId(word.id);
      setFeedback({
        tone: "info",
        message: `Copied "${word.name}" to the clipboard.`
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Clipboard access is not available in this browser."
      });
    }
  };

  const handleNextDeck = () => {
    if (filteredWords.length <= DECK_SIZE) return;

    const nextCursor = deckCursor + DECK_SIZE;

    startTransition(() => {
      if (nextCursor >= deckWords.length) {
        setDeckCursor(0);
        setDeckVersion((previous) => previous + 1);
        setActiveWordId(null);
        return;
      }

      const nextDeck = deckWords.slice(nextCursor, nextCursor + DECK_SIZE);
      setDeckCursor(nextCursor);
      if (!nextDeck.some((word) => word.id === activeWordId)) {
        setActiveWordId(nextDeck[0]?.id ?? null);
      }
    });
  };

  const handleReshuffle = () => {
    startTransition(() => {
      setDeckCursor(0);
      setDeckVersion((previous) => previous + 1);
      setActiveWordId(null);
    });
  };

  const visibleWordIds = useMemo(
    () => new Set(visibleDeck.map((word) => word.id)),
    [visibleDeck]
  );
  const visibleSelectedCount = Array.from(selectedIds).filter((id) => visibleWordIds.has(id)).length;
  const workspaceStats = [
    {
      label: "Saved",
      value: words.length,
      detail: "Total words on the shelf"
    },
    {
      label: "Match",
      value: filteredWords.length,
      detail: "After search and sorting"
    },
    {
      label: "Picked",
      value: selectedCount,
      detail: "Ready for bulk delete"
    }
  ];

  return (
    <div className="space-y-5">
      <section className="study-panel px-5 py-5 sm:px-6 sm:py-6">
        <div className="relative z-10 space-y-5">
          <div className="workbench-header">
            <div className="workbench-heading">
              <span className="hero-kicker">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Focused vocabulary desk
              </span>
              <div className="space-y-2">
                <h1 className="display-font text-3xl leading-none tracking-tight text-foreground sm:text-[2.75rem]">
                  Vocabulary desk
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Add, scan, sort, and keep one word in focus from the same compact workspace.
                </p>
              </div>
            </div>

            <div className="workbench-stats">
              {workspaceStats.map((item) => (
                <div key={item.label} className="stat-chip">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold leading-none text-foreground">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="workbench-console">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_180px_160px] lg:items-end">
                <label htmlFor="word-input" className="control-field">
                  <span className="control-label">Add word</span>
                  <Input
                    id="word-input"
                    className="h-12"
                    placeholder="for example: serendipity"
                    value={draftWord}
                    onChange={(event) => setDraftWord(event.target.value)}
                    minLength={1}
                    required
                  />
                </label>

                <label htmlFor="search-words" className="control-field">
                  <span className="control-label">Search shelf</span>
                  <Input
                    id="search-words"
                    className="h-12"
                    placeholder="Search words"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                      }
                    }}
                  />
                </label>

                <label className="control-field">
                  <span className="control-label">Sort</span>
                  <select
                    className="control-select"
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </label>

                <div className="control-field">
                  <span className="control-label">Commit</span>
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Saving..." : "Add word"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="workbench-actions-row">
              <p className="workbench-note">
                Lowercase only. Duplicate saves are ignored.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFeedback(null);
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Import
                </Button>
                <Button variant="outline" onClick={handleExport} disabled={filteredWords.length === 0}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteSelected}
                  disabled={selectedCount === 0}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete selected
                </Button>
                <Button variant="destructive" onClick={handleClearAll} disabled={words.length === 0}>
                  Clear all
                </Button>
              </div>
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

          {feedback ? (
            <div
              className={cn(
                "rounded-[24px] border px-4 py-3 text-sm",
                feedback.tone === "error"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border/70 bg-white/70 text-muted-foreground"
              )}
            >
              {feedback.message}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <section className="study-panel px-5 py-6 sm:px-6">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  Card deck
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    Showing {deckCount} of {filteredWords.length} matching words
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-muted-foreground sm:block" />
                  <span>
                    Set {deckIndex} of {deckTotal}
                  </span>
                  <span className="hidden h-1 w-1 rounded-full bg-muted-foreground sm:block" />
                  <span>{visibleSelectedCount} selected in this spread</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleReshuffle} disabled={filteredWords.length === 0}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reshuffle
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextDeck}
                  disabled={filteredWords.length <= DECK_SIZE}
                >
                  Next spread
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {visibleDeck.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-border/80 bg-white/60 px-6 py-12 text-center">
                <h2 className="display-font text-3xl text-foreground">The desk is empty.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Add your first word above or clear the search field to bring matching cards back.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3 [content-visibility:auto]">
                {visibleDeck.map((word, index) => {
                  const isActive = word.id === activeWordId;
                  const isSelected = selectedIds.has(word.id);

                  return (
                    <article
                      key={word.id}
                      style={getCardStyle(word.id, index)}
                      className={cn(
                        "word-card group relative flex min-h-[184px] flex-col justify-between rounded-[26px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,239,229,0.92))] p-4 text-left shadow-[0_18px_44px_-28px_rgba(54,39,24,0.5)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_52px_-28px_rgba(54,39,24,0.58)] sm:p-5",
                        isActive
                          ? "border-foreground/30 ring-2 ring-foreground/10"
                          : "border-border/70",
                        isSelected ? "bg-[linear-gradient(180deg,rgba(255,246,239,0.98),rgba(255,233,218,0.92))]" : ""
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <button
                          type="button"
                          className="flex-1 text-left"
                          onClick={() => {
                            startTransition(() => setActiveWordId(word.id));
                          }}
                        >
                          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                            Focus word
                          </p>
                          <h3 className="display-font mt-4 text-3xl capitalize leading-none text-foreground sm:text-[2.15rem]">
                            {word.name}
                          </h3>
                        </button>

                        <button
                          type="button"
                          className={cn(
                            "inline-flex min-w-[88px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition",
                            isSelected
                              ? "border-foreground/15 bg-foreground text-white"
                              : "border-border/80 bg-white/75 text-muted-foreground hover:bg-white"
                          )}
                          onClick={() => toggleSelected(word.id)}
                        >
                          {isSelected ? "Picked" : "Pick"}
                        </button>
                      </div>

                      <button
                        type="button"
                        className="mt-8 flex items-center justify-between rounded-[20px] border border-border/60 bg-white/65 px-4 py-3 text-sm text-muted-foreground transition hover:bg-white/90"
                        onClick={() => {
                          startTransition(() => setActiveWordId(word.id));
                        }}
                      >
                        <span suppressHydrationWarning>
                          Added {formatRelativeTime(word.createdAt)}
                        </span>
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="study-panel px-5 py-6 sm:px-6 xl:sticky xl:top-6 xl:self-start">
          <div className="relative z-10 space-y-4">
            {activeWord ? (
              <>
                <div className="space-y-4 rounded-[28px] border border-border/70 bg-white/70 p-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                      Spotlight
                    </p>
                    <h2 className="display-font text-5xl capitalize leading-none text-foreground">
                      {activeWord.name}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span className="rounded-full border border-border/70 bg-white/70 px-3 py-1.5">
                      Added {formatTimestamp(activeWord.createdAt)}
                    </span>
                    <span className="rounded-full border border-border/70 bg-white/70 px-3 py-1.5">
                      {selectedIds.has(activeWord.id) ? "Selected for bulk delete" : "Not selected"}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => void handleCopy(activeWord)}>
                      {copiedWordId === activeWord.id ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden="true" />
                      )}
                      {copiedWordId === activeWord.id ? "Copied" : "Copy word"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toggleSelected(activeWord.id)}
                    >
                      {selectedIds.has(activeWord.id) ? "Unpick word" : "Pick word"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        startTransition(() => {
                          setDeckCursor(0);
                          setDeckVersion((previous) => previous + 1);
                          setActiveWordId(null);
                        });
                      }}
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Fresh spread
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => void handleDeleteWord(activeWord.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete word
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 rounded-[28px] border border-border/70 bg-white/70 p-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Reference shelf</h3>
                    <p className="text-sm text-muted-foreground">
                      Quick links are shown once here instead of repeating on every card.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {WORD_LINKS.map((item) => (
                      <a
                        key={item.label}
                        href={resolveHref(item.href, activeWord.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-between rounded-[20px] border border-border/80 bg-white px-4 py-3 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:bg-secondary"
                      >
                        <span>{item.label}</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-[28px] border border-border/70 bg-white/70 p-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Pronounce</h3>
                    <p className="text-sm text-muted-foreground">
                      Embedded with the YouGlish JavaScript widget, so you can stay in the same
                      workspace while listening.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "American", value: "us" as const },
                      { label: "British", value: "uk" as const },
                      { label: "Australian", value: "aus" as const }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAccent(option.value)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                          accent === option.value
                            ? "border-foreground/15 bg-foreground text-white"
                            : "border-border/80 bg-white text-muted-foreground hover:bg-secondary"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <PronounceWidget term={activeWord.name} accent={accent} />
                </div>
              </>
            ) : (
              <div className="rounded-[28px] border border-dashed border-border/70 bg-white/70 px-6 py-12 text-center">
                <h2 className="display-font text-3xl text-foreground">No focus word yet.</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Add a word or open a matching card to activate the pronounce panel and reference
                  shelf.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
