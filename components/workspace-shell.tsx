import Image from "next/image";
import Link from "next/link";
import { BookOpen, LogOut, Settings } from "lucide-react";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const userLabel = user.name || user.email || "Google account";

  return (
    <main className="page-shell space-y-5">
      <header className="study-panel px-5 py-4 sm:px-6">
        <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <Link href="/" className="brand-mark">
              <span className="brand-mark__icon">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>
                <span className="brand-mark__eyebrow">Private workspace</span>
                <span className="brand-mark__title">Words Book</span>
              </span>
            </Link>

            <nav className="workspace-nav" aria-label="Workspace">
              <Link
                href="/"
                className={cn("workspace-nav__link", currentPath === "/" && "workspace-nav__link--active")}
              >
                Workspace
              </Link>
              <Link
                href="/settings"
                className={cn(
                  "workspace-nav__link",
                  currentPath === "/settings" && "workspace-nav__link--active"
                )}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Settings
              </Link>
            </nav>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="account-chip">
              <span className={cn("account-chip__avatar", user.image && "account-chip__avatar--image")}>
                {user.image ? (
                  <Image src={user.image} alt="" fill sizes="44px" className="object-cover" aria-hidden="true" />
                ) : (
                  getUserInitials(user)
                )}
              </span>
              <span className="min-w-0">
                <span className="account-chip__label">Signed in with Google</span>
                <span className="account-chip__value">{userLabel}</span>
              </span>
            </div>

            <form action={handleSignOut}>
              <Button type="submit" variant="outline">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {children}
    </main>
  );
}
