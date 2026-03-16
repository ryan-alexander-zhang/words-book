import Link from "next/link";
import { BookOpen, LogOut, Settings2 } from "lucide-react";
import { signOut } from "@/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type WorkspaceShellProps = {
  children: React.ReactNode;
  currentPath: "/" | "/settings";
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

function getUserInitials(user: WorkspaceShellProps["user"]) {
  const source = user.name?.trim() || user.email?.trim() || "wb";
  return source.slice(0, 2).toUpperCase();
}

async function handleSignOut() {
  "use server";

  await signOut({
    redirectTo: "/signin"
  });
}

export function WorkspaceShell({ children, currentPath, user }: WorkspaceShellProps) {
  const userLabel = user.name || user.email || "Google Account";

  return (
    <main id="main-content" className="page-shell">
      <header className="flex flex-col gap-4 rounded-xl border bg-card px-4 py-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg border bg-primary text-primary-foreground">
                <BookOpen className="size-4" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <Badge variant="outline" className="w-fit">
                  Private Workspace
                </Badge>
                <span className="text-lg font-semibold tracking-tight text-balance">Words Book</span>
              </div>
            </Link>

            <Separator orientation="vertical" className="hidden h-8 lg:block" />

            <nav aria-label="Workspace" className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant={currentPath === "/" ? "secondary" : "ghost"}>
                <Link href="/">Workspace</Link>
              </Button>
              <Button asChild size="sm" variant={currentPath === "/settings" ? "secondary" : "ghost"}>
                <Link href="/settings">
                  <Settings2 data-icon="inline-start" aria-hidden="true" />
                  Settings
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
              <Avatar size="lg">
                <AvatarImage src={user.image ?? undefined} alt={userLabel} />
                <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{userLabel}</p>
                <p className="truncate text-xs text-muted-foreground">Signed in with Google</p>
              </div>
            </div>

            <form action={handleSignOut}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut data-icon="inline-start" aria-hidden="true" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6">{children}</div>
    </main>
  );
}
