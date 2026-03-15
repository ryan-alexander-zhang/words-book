import { mutateWordsAction } from "@/app/actions/words";
import { WorkspaceShell } from "@/components/workspace-shell";
import { WordManager } from "@/components/word-manager";
import { requireSessionUser } from "@/lib/session";
import { listWordsForOwner, serializeWords } from "@/lib/words";

export default async function Home() {
  const user = await requireSessionUser();
  const words = await listWordsForOwner(user.id);
  const serialized = serializeWords(words);

  return (
    <WorkspaceShell currentPath="/" user={user}>
      <WordManager initialWords={serialized} mutateWordsAction={mutateWordsAction} />
    </WorkspaceShell>
  );
}
