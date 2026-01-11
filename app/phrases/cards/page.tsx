import { prisma } from "@/lib/prisma";
import { type TextItem } from "@/lib/types";
import { TextCardView } from "@/components/text-card-view";
import { SectionNav } from "@/components/section-nav";

export const dynamic = "force-dynamic";

export default async function PhraseCardsPage() {
  const phrases = await prisma.phrase.findMany({
    orderBy: { createdAt: "desc" }
  });
  const serialized: TextItem[] = phrases.map((phrase) => ({
    id: phrase.id,
    content: phrase.content,
    annotation: phrase.annotation,
    createdAt: phrase.createdAt.toISOString()
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Phrase cards</h1>
          <p className="text-muted-foreground">
            Set the maximum cards and get a random, non-repeating selection.
          </p>
        </div>
        <SectionNav currentHref="/phrases/cards" cardsHref="/phrases/cards" />
      </header>

      <TextCardView items={serialized} label="phrases" />
    </main>
  );
}
