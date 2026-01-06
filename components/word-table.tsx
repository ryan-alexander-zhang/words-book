import { type Word } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { WORD_LINKS, resolveHref } from "@/lib/word-links";

interface WordTableProps {
  words: Word[];
}

export function WordTable({ words }: WordTableProps) {
  if (words.length === 0) {
    return <p className="text-sm text-muted-foreground">No words yet. Start by adding one!</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Word</TableHead>
            <TableHead>Links</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {words.map((word) => (
            <TableRow key={word.id}>
              <TableCell className="font-medium capitalize">{word.name}</TableCell>
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
