import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { type TextItem } from "@/lib/types";
import { TextCardView } from "@/components/text-card-view";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SentenceCardsPage() {
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
          <h1 className="text-3xl font-bold">Sentence cards</h1>
          <p className="text-muted-foreground">
            Set the maximum cards and get a random, non-repeating selection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/sentences">Back to sentences</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Words</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/phrases">Phrases</Link>
          </Button>
        </div>
      </header>

      <TextCardView items={serialized} label="sentences" />
    </main>
  );
}
