import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TextManager } from "@/components/text-manager";
import { type TextItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PhrasesPage() {
  const phrases = await prisma.phrase.findMany({
    orderBy: { createdAt: "desc" }
  });
  const serialized: TextItem[] = phrases.map((phrase) => ({
    id: phrase.id,
    content: phrase.content,
    createdAt: phrase.createdAt.toISOString()
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Phrases</h1>
          <p className="text-muted-foreground">Collect short expressions you want to remember.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/">Words</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sentences">Sentences</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/phrases/cards">Random cards</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add a new phrase</CardTitle>
          <CardDescription>
            Paste or type phrases to collect them alongside your words list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TextManager
            initialItems={serialized}
            apiPath="/api/phrases"
            singularLabel="Phrase"
            pluralLabel="Phrases"
            placeholder="Enter a new phrase"
            exportFileName="phrases-book.json"
          />
        </CardContent>
      </Card>
    </main>
  );
}
