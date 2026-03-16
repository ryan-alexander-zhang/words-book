"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleAlert, Copy, Download, ExternalLink, FileUp, Info, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type WordsMutationResult } from "@/app/actions/words";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { type WordItem } from "@/lib/types";
import {
  WORD_VALIDATION_HELP_TEXT,
  getWordValidationError,
  getWordsValidationError
} from "@/lib/word-validation";
import { WORD_LINKS, YOUGLISH_ACCENTS, resolveHref, resolveYouglishPronounceHref } from "@/lib/word-links";

interface WordManagerProps {
  initialWords: WordItem[];
  mutateWordsAction: (input:
    | { type: "add"; name: string }
    | { type: "import"; names: string[] }
    | { type: "delete"; ids: number[] }
    | { type: "clear" }) => Promise<WordsMutationResult>;
}

type SortOrder = "desc" | "asc";
type FeedbackTone = "error" | "info";

const IMPORT_FILE_SIZE_LIMIT_BYTES = 4 * 1024 * 1024;

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

const numberFormatter = new Intl.NumberFormat("en-US");

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

function readWordsResult(result: WordsMutationResult) {
  if (result.error) {
    throw new Error(result.error);
  }

  return normalizeWords(result.words ?? []);
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

export function WordManager({ initialWords, mutateWordsAction }: WordManagerProps) {
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const router = useRouter();
  const pathname = usePathname();
  const [words, setWords] = useState<WordItem[]>(initialWords);
  const [draftWord, setDraftWord] = useState("");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [sortOrder, setSortOrder] = useState<SortOrder>(searchParams.get("sort") === "asc" ? "asc" : "desc");
  const deferredQuery = useDeferredValue(query);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; message: string } | null>(null);
  const [activeWordId, setActiveWordId] = useState<number | null>(initialWords[0]?.id ?? null);
  const [copiedWordId, setCopiedWordId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setWords(initialWords);
    setActiveWordId(initialWords[0]?.id ?? null);
  }, [initialWords]);

  useEffect(() => {
    const nextQuery = searchParams.get("q") ?? "";
    const nextSort = searchParams.get("sort") === "asc" ? "asc" : "desc";

    if (nextQuery !== query) {
      setQuery(nextQuery);
    }

    if (nextSort !== sortOrder) {
      setSortOrder(nextSort);
    }
  }, [query, searchParams, searchParamsString, sortOrder]);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const trimmedQuery = query.trim();

    if (trimmedQuery) {
      params.set("q", trimmedQuery);
    } else {
      params.delete("q");
    }

    if (sortOrder === "asc") {
      params.set("sort", sortOrder);
    } else {
      params.delete("sort");
    }

    const nextSearch = params.toString();

    if (nextSearch !== searchParamsString) {
      startTransition(() => {
        router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, {
          scroll: false
        });
      });
    }
  }, [pathname, query, router, searchParamsString, sortOrder]);

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
    if (filteredWords.length === 0) {
      setActiveWordId(null);
      return;
    }

    if (activeWordId && filteredWords.some((word) => word.id === activeWordId)) {
      return;
    }

    setActiveWordId(filteredWords[0]?.id ?? null);
  }, [activeWordId, filteredWords]);

  const activeWord = filteredWords.find((word) => word.id === activeWordId) ?? null;

  const applyWords = (nextWords: WordItem[]) => {
    setWords(nextWords);
    setActiveWordId((previous) => {
      if (previous && nextWords.some((word) => word.id === previous)) {
        return previous;
      }

      return nextWords[0]?.id ?? null;
    });
  };

  const handleAdd = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = draftWord.trim();
    const validationError = getWordValidationError(trimmed);

    if (validationError) {
      setFeedback({
        tone: "error",
        message: validationError
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      setDraftWord("");
      applyWords(readWordsResult(await mutateWordsAction({ type: "add", name: trimmed })));
      setFeedback({
        tone: "info",
        message: `Added “${trimmed}” to your workspace.`
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to add the word."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWord = async (wordId: number) => {
    setLoading(true);
    setFeedback(null);

    try {
      const deletedWord = words.find((word) => word.id === wordId)?.name ?? "The word";
      applyWords(readWordsResult(await mutateWordsAction({ type: "delete", ids: [wordId] })));
      setFeedback({
        tone: "info",
        message: `Removed “${deletedWord}” from your workspace.`
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to delete the word."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (words.length === 0) return;

    setLoading(true);
    setFeedback(null);

    try {
      applyWords(readWordsResult(await mutateWordsAction({ type: "clear" })));
      setFeedback({
        tone: "info",
        message: "All words were removed from your workspace."
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to clear the workspace."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    if (file.size > IMPORT_FILE_SIZE_LIMIT_BYTES) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setFeedback({
        tone: "error",
        message: "File is too large. Import a JSON file up to 4 MB."
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const payload = JSON.parse(await file.text()) as unknown;
      const names = extractNames(payload);
      const validationError = getWordsValidationError(names);

      if (validationError) {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setFeedback({
          tone: "error",
          message: validationError
        });
        return;
      }

      const existing = new Set(words.map((word) => word.name.toLowerCase()));
      const uniqueNames = Array.from(new Set(names)).filter((name) => !existing.has(name));

      if (uniqueNames.length === 0) {
        setFeedback({
          tone: "info",
          message: "No new words were found in that file."
        });
        return;
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      applyWords(readWordsResult(await mutateWordsAction({ type: "import", names: uniqueNames })));
      setFeedback({
        tone: "info",
        message: `${numberFormatter.format(uniqueNames.length)} word${uniqueNames.length === 1 ? "" : "s"} were imported.`
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to import that file."
      });
    } finally {
      setLoading(false);
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
        message: `Copied “${word.name}” to the clipboard.`
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Clipboard access is not available in this browser."
      });
    }
  };

  const workspaceStats = [
    {
      label: "Saved",
      value: numberFormatter.format(words.length),
      detail: "Words in your workspace"
    },
    {
      label: "Showing",
      value: numberFormatter.format(filteredWords.length),
      detail: query.trim() ? "Matching current filters" : "Visible right now"
    },
    {
      label: "Selected",
      value: activeWord ? "Ready" : "None",
      detail: activeWord ? "Detail actions are available" : "Choose a word to continue"
    }
  ];

  const emptyStateTitle = words.length === 0 ? "No words saved yet." : "No matching words.";
  const emptyStateDescription = words.length === 0
    ? "Add your first word, or import a JSON file to populate the workspace."
    : "Adjust your search or sort to bring matching words back into view.";

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl flex-col gap-3">
          <Badge variant="outline" className="w-fit">
            Workspace
          </Badge>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">Vocabulary Workspace</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Add new words, search your saved list, and keep one reference panel open while you study.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {workspaceStats.map((item) => (
            <div key={item.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="gap-1">
          <CardTitle>Add, Search & Import</CardTitle>
          <CardDescription>
            {WORD_VALIDATION_HELP_TEXT} Imported entries are stored in lowercase and duplicates are ignored.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <form onSubmit={handleAdd} className="flex flex-col gap-5">
            <FieldGroup className="lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_180px_160px] lg:items-end">
              <Field>
                <FieldLabel htmlFor="word-input">Add Word</FieldLabel>
                <Input
                  id="word-input"
                  name="word"
                  value={draftWord}
                  placeholder="serendipity…"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => setDraftWord(event.target.value)}
                  minLength={1}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="search-words">Search</FieldLabel>
                <Input
                  id="search-words"
                  name="query"
                  value={query}
                  placeholder="Search words…"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                    }
                  }}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="sort-words">Sort</FieldLabel>
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                  <SelectTrigger id="sort-words" className="w-full">
                    <SelectValue placeholder="Sort words" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="add-word-submit">Save Word</FieldLabel>
                <Button id="add-word-submit" type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <LoaderCircle data-icon="inline-start" className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus data-icon="inline-start" aria-hidden="true" />
                  )}
                  {loading ? "Saving…" : "Add Word"}
                </Button>
              </Field>
            </FieldGroup>
          </form>

          <Separator />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-2xl flex-col gap-1">
              <p className="text-sm leading-6 text-muted-foreground">
                Import a JSON file up to 4 MB, export the current result set, or clear the workspace after confirmation.
              </p>
              <FieldDescription>
                Use search and sort to narrow the exported data set before downloading it.
              </FieldDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFeedback(null);
                  fileInputRef.current?.click();
                }}
                disabled={loading}
              >
                <FileUp data-icon="inline-start" aria-hidden="true" />
                Import
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleExport}
                disabled={filteredWords.length === 0}
              >
                <Download data-icon="inline-start" aria-hidden="true" />
                Export
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={words.length === 0 || loading}>
                    <Trash2 data-icon="inline-start" aria-hidden="true" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
                      <Trash2 aria-hidden="true" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Clear the entire workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes every saved word from your personal workspace. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel variant="ghost">Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={() => void handleClearAll()}>
                      Clear Workspace
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (!file) {
                return;
              }

              void handleImport(file);
            }}
          />

          {feedback ? (
            <Alert
              variant={feedback.tone === "error" ? "destructive" : "default"}
              aria-live="polite"
            >
              {feedback.tone === "error" ? <CircleAlert aria-hidden="true" /> : <Info aria-hidden="true" />}
              <AlertTitle>{feedback.tone === "error" ? "Action Failed" : "Workspace Updated"}</AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <Card className="min-w-0">
          <CardHeader className="gap-2">
            <CardAction>
              <Badge variant="outline">
                {numberFormatter.format(filteredWords.length)} Result{filteredWords.length === 1 ? "" : "s"}
              </Badge>
            </CardAction>
            <CardTitle>Word List</CardTitle>
            <CardDescription>
              {query.trim()
                ? `Showing matches for “${query.trim()}”.`
                : "Browse your saved words and open one in the detail panel."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {filteredWords.length === 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/20 px-4 py-10 text-center">
                <h2 className="text-xl font-semibold tracking-tight">{emptyStateTitle}</h2>
                <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                  {emptyStateDescription}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Word</TableHead>
                    <TableHead className="hidden md:table-cell">Added</TableHead>
                    <TableHead className="w-[120px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[content-visibility:auto]">
                  {filteredWords.map((word) => {
                    const isActive = word.id === activeWordId;

                    return (
                      <TableRow key={word.id} data-state={isActive ? "selected" : undefined}>
                        <TableCell className="min-w-0 whitespace-normal">
                          <button
                            type="button"
                            className="flex w-full min-w-0 flex-col gap-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            onClick={() => setActiveWordId(word.id)}
                          >
                            <span className="break-words text-sm font-medium">{word.name}</span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              Added {formatRelativeTime(word.createdAt)}
                            </span>
                          </button>
                        </TableCell>
                        <TableCell className="hidden whitespace-normal text-sm text-muted-foreground md:table-cell">
                          <div className="flex flex-col gap-1">
                            <span className="tabular-nums">{formatRelativeTime(word.createdAt)}</span>
                            <span className="text-xs tabular-nums">{formatTimestamp(word.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant={isActive ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveWordId(word.id)}
                          >
                            {isActive ? "Selected" : "Open"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 xl:sticky xl:top-6 xl:self-start">
          {activeWord ? (
            <>
              <Card>
                <CardHeader className="gap-3">
                  <Badge variant="secondary" className="w-fit">
                    Selected Word
                  </Badge>
                  <div className="flex flex-col gap-1">
                    <CardTitle className="break-words text-2xl tracking-tight">{activeWord.name}</CardTitle>
                    <CardDescription className="tabular-nums">
                      Added {formatTimestamp(activeWord.createdAt)}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => void handleCopy(activeWord)}>
                      {copiedWordId === activeWord.id ? (
                        <Check data-icon="inline-start" aria-hidden="true" />
                      ) : (
                        <Copy data-icon="inline-start" aria-hidden="true" />
                      )}
                      {copiedWordId === activeWord.id ? "Copied" : "Copy Word"}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={loading}>
                          <Trash2 data-icon="inline-start" aria-hidden="true" />
                          Delete Word
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
                            <Trash2 aria-hidden="true" />
                          </AlertDialogMedia>
                          <AlertDialogTitle>Delete “{activeWord.name}”?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the word from your workspace and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel variant="ghost">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => void handleDeleteWord(activeWord.id)}
                          >
                            Delete Word
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-1">
                  <CardTitle>Reference Links</CardTitle>
                  <CardDescription>
                    Open a dictionary or reference page without re-entering the current word.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {WORD_LINKS.map((item) => (
                    <Button
                      key={item.label}
                      asChild
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <a href={resolveHref(item.href, activeWord.name)} target="_blank" rel="noreferrer">
                        {item.label}
                        <ExternalLink data-icon="inline-end" aria-hidden="true" />
                      </a>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-1">
                  <CardTitle>Pronunciation</CardTitle>
                  <CardDescription>
                    Jump to YouGlish with the accent you want to hear.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                  {YOUGLISH_ACCENTS.map((option) => (
                    <Button
                      key={option.value}
                      asChild
                      variant="outline"
                      size="sm"
                      className="justify-between"
                    >
                      <a
                        href={resolveYouglishPronounceHref(activeWord.name, option.value)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {option.label}
                        <ExternalLink data-icon="inline-end" aria-hidden="true" />
                      </a>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader className="gap-1">
                <CardTitle>No Word Selected</CardTitle>
                <CardDescription>
                  Choose a word from the list to open copy, delete, reference, and pronunciation actions.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
