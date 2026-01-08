import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TextManager } from "@/components/text-manager";
import { type TextItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SentencesPage() {
  const sentences = await prisma.sentence.findMany({
    orderBy: { createdAt: "desc" }
  });
  const serialized: TextItem[] = sentences.map((sentence) => ({
    id: sentence.id,
    content: sentence.content,
    createdAt: sentence.createdAt.toISOString()
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Sentences</h1>
          <p className="text-muted-foreground">Save full sentences for later review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/">Words</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/phrases">Phrases</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sentences/cards">Random cards</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add a new sentence</CardTitle>
          <CardDescription>
            Paste or type sentences to build a reading list for quick practice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TextManager
            initialItems={serialized}
            apiPath="/api/sentences"
            singularLabel="Sentence"
            pluralLabel="Sentences"
            placeholder="Enter a new sentence"
            exportFileName="sentences-book.json"
          />
        </CardContent>
      </Card>
    </main>
  );
}
