import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, LockKeyhole } from "lucide-react";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

async function handleGoogleSignIn() {
  "use server";

  await signIn("google", {
    redirectTo: "/"
  });
}

export default async function SignInPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <section className="study-panel w-full max-w-xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative z-10 mx-auto flex max-w-md flex-col items-center text-center">
          <span className="inline-flex items-center gap-3 rounded-full border border-border/75 bg-white/85 px-4 py-2 shadow-[0_16px_34px_-28px_rgba(54,39,24,0.44)]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-left">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Words Book
              </span>
              <span className="block text-sm font-semibold text-foreground">Private workspace</span>
            </span>
          </span>

          <div className="mt-10 space-y-4">
            <h1 className="display-font text-5xl leading-none tracking-tight text-foreground sm:text-6xl">
              Enter your workspace
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              One account. One personal library.
            </p>
          </div>

          <form action={handleGoogleSignIn} className="mt-10 w-full">
            <Button type="submit" size="lg" className="w-full">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Continue with Google
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
