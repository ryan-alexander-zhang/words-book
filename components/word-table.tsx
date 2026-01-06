import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { WORD_LINKS, resolveHref } from "@/lib/word-links";
import { type WordItem } from "@/lib/types";

interface WordTableProps {
  words: WordItem[];
  selectedIds: Set<number>;
  allSelected: boolean;
  onToggleSelect: (id: number) => void;
  onToggleAll: (checked: boolean) => void;
}

export function WordTable({ words, selectedIds, onToggleSelect, onToggleAll, allSelected }: WordTableProps) {
  if (words.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No words found. Add a new word or 调整筛选条件。</p>
    );
  }

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
            <TableHead className="w-32">Word</TableHead>
            <TableHead className="w-48">Added</TableHead>
            <TableHead>Links</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {words.map((word) => (
            <TableRow key={word.id}>
              <TableCell>
                <input
                  type="checkbox"
                  aria-label={`Select ${word.name}`}
                  checked={selectedIds.has(word.id)}
                  onChange={() => onToggleSelect(word.id)}
                />
              </TableCell>
              <TableCell className="font-medium capitalize">{word.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(word.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {WORD_LINKS.map((item) => (
                    <a
                      key={item.label}
                      className="text-sm text-primary underline underline-offset-4"
                      href={resolveHref(item.href, word.name)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
