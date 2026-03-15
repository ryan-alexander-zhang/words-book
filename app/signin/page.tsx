import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
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
      <section className="study-panel w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_360px] xl:items-center">
          <div className="space-y-5">
            <span className="hero-kicker">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Google sign-in required
            </span>
            <div className="space-y-3">
              <h1 className="display-font text-5xl leading-none tracking-tight text-foreground sm:text-6xl">
                Private vocabulary desk for one account at a time.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Your saved words stay attached to the account you sign in with. Start in the
                browser, then connect Raycast, extensions, or your own scripts whenever you need
                them.
              </p>
            </div>
          </div>

          <div className="rounded-[30px] border border-border/70 bg-white/75 p-5 shadow-[0_20px_48px_-32px_rgba(54,39,24,0.42)]">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                  Secure access
                </p>
                <h2 className="text-2xl font-semibold text-foreground">Enter with Google</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use Google to open your private workspace. If you later want to connect external
                  tools, you can issue a separate access credential from Settings.
                </p>
              </div>

              <form action={handleGoogleSignIn} className="space-y-4">
                <Button type="submit" size="lg" className="w-full">
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  Continue with Google
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
