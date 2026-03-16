import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, LockKeyhole } from "lucide-react";
import { signIn } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { getSessionUser } from "@/lib/session";

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
    <main id="main-content" className="page-shell items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border bg-primary text-primary-foreground">
              <BookOpen className="size-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="w-fit">
                Words Book
              </Badge>
              <h1 className="text-xl font-semibold tracking-tight text-balance">
                Sign in to your private workspace
              </h1>
            </div>
          </div>
          <CardDescription>
            Use your Google account to manage saved words, pronunciation links, and personal API access.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={handleGoogleSignIn}>
            <Button type="submit" size="lg" className="w-full">
              <LockKeyhole data-icon="inline-start" aria-hidden="true" />
              Continue with Google
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          </form>
        </CardContent>

        <CardFooter>
          <p className="text-sm text-muted-foreground">
            One account, one personal word list, one credential center.
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
