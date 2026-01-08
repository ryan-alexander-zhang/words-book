import { prisma } from "@/lib/prisma";
import { WordManager } from "@/components/word-manager";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type WordItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const words = await prisma.word.findMany({
    orderBy: { createdAt: "desc" }
  });
  const serialized: WordItem[] = words.map((word) => ({
    id: word.id,
    name: word.name,
    createdAt: word.createdAt.toISOString()
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Words Book</h1>
          <p className="text-muted-foreground">
            Add words once and jump to your favorite references with a single click.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/phrases">Phrases</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sentences">Sentences</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/cards">Random cards</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Add a new word</CardTitle>
          <CardDescription>
            Paste or type the vocabulary you want to track. We will generate quick links to
            Vocabulary.com, Youglish, Dictionary.com, Youdao, and Collins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WordManager initialWords={serialized} />
        </CardContent>
      </Card>
    </main>
  );
}
