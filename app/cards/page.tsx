import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { type WordItem } from "@/lib/types";
import { WordCardView } from "@/components/word-card-view";
import { Button } from "@/components/ui/button";

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
          <h1 className="text-3xl font-bold">随机卡片</h1>
          <p className="text-muted-foreground">
            设置最大卡片数后，随机抽取不重复的单词展示。
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">返回单词列表</Link>
        </Button>
      </header>

      <WordCardView words={serialized} />
    </main>
  );
}
