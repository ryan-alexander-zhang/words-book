import { prisma } from "@/lib/prisma";
import { WordManager } from "@/components/word-manager";
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
    <main className="page-shell">
      <WordManager initialWords={serialized} />
    </main>
  );
}
