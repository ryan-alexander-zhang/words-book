import { prisma } from "@/lib/prisma";
import { type WordItem } from "@/lib/types";
import { WordCardView } from "@/components/word-card-view";
import { SectionNav } from "@/components/section-nav";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
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
          <h1 className="text-3xl font-bold">Random cards</h1>
          <p className="text-muted-foreground">
            Set the maximum cards and get a random, non-repeating selection.
          </p>
        </div>
        <SectionNav currentHref="/cards" cardsHref="/cards" />
      </header>

      <WordCardView words={serialized} />
    </main>
  );
}
