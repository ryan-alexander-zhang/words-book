import { WorkspaceShell } from "@/components/workspace-shell";
import { TokenSettings } from "@/components/token-settings";
import { getApiTokenStatus } from "@/lib/api-token-service";
import { requireSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireSessionUser();
  const tokenStatus = await getApiTokenStatus(user.id);

  return (
    <WorkspaceShell currentPath="/settings" user={user}>
      <TokenSettings user={user} initialTokenStatus={tokenStatus} />
    </WorkspaceShell>
  );
}
