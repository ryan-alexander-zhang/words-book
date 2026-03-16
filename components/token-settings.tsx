"use client";

import { useState, useTransition } from "react";
import { Check, CircleAlert, CircleHelp, Copy, KeyRound, LoaderCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type ApiTokenStatus } from "@/lib/types";

type TokenSettingsProps = {
  initialTokenStatus: ApiTokenStatus;
  rotateTokenAction: () => Promise<{
    status?: ApiTokenStatus;
    value?: string;
    error?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not Yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

type FeedbackState =
  | {
      tone: "error" | "info";
      message: string;
    }
  | null;

function DeveloperReferenceTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Show developer reference">
          <CircleHelp aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="max-w-sm">
        <div className="flex flex-col gap-2">
          <p className="font-medium">Developer Reference</p>
          <p>
            Header: <code className="rounded bg-background/80 px-1 py-0.5 font-mono">Authorization: Bearer &lt;token&gt;</code>
          </p>
          <p>
            Endpoint: <code className="rounded bg-background/80 px-1 py-0.5 font-mono">/api/v1/words</code>
          </p>
          <p>
            Methods: <code className="rounded bg-background/80 px-1 py-0.5 font-mono">GET</code> to read words and{" "}
            <code className="rounded bg-background/80 px-1 py-0.5 font-mono">POST</code> to create them.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function TokenSettings({ initialTokenStatus, rotateTokenAction }: TokenSettingsProps) {
  const [tokenStatus, setTokenStatus] = useState(initialTokenStatus);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const actionLabel = tokenStatus.hasToken ? "Rotate Token" : "Create Token";
  const pendingLabel = tokenStatus.hasToken ? "Rotating…" : "Creating…";

  const rotateToken = () => {
    setFeedback(null);
    setCopied(false);

    startTransition(() => {
      void (async () => {
        try {
          const payload = await rotateTokenAction();

          if (payload.error) {
            throw new Error(payload.error);
          }

          if (payload.status) {
            setTokenStatus(payload.status);
          }

          setRevealedToken(payload.value ?? null);
          setFeedback({
            tone: "info",
            message: tokenStatus.hasToken
              ? "The token was rotated. Copy the new value before leaving this page."
              : "The token was created. Copy the value before leaving this page."
          });
        } catch (error) {
          setFeedback({
            tone: "error",
            message:
              error instanceof Error ? error.message : "Unable to update the access token."
          });
        }
      })();
    });
  };

  const copyToken = async () => {
    if (!revealedToken) {
      return;
    }

    try {
      await navigator.clipboard.writeText(revealedToken);
      setCopied(true);
      setFeedback({
        tone: "info",
        message: "The access token was copied to the clipboard."
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Clipboard access is not available in this browser."
      });
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Badge variant="outline" className="w-fit">
          Settings
        </Badge>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Access Token</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Create or rotate the token that trusted tools use to access your personal workspace.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={tokenStatus.hasToken ? "secondary" : "outline"}>
                  {tokenStatus.hasToken ? "Active" : "Not Created"}
                </Badge>
                <DeveloperReferenceTooltip />
              </div>
              <div className="flex flex-col gap-1">
                <CardTitle className="text-2xl">Token Management</CardTitle>
                <CardDescription>
                  Applies to your current signed-in workspace and the public automation endpoint.
                </CardDescription>
              </div>
            </div>

            <Button onClick={rotateToken} disabled={isPending}>
              {isPending ? (
                <LoaderCircle data-icon="inline-start" className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw data-icon="inline-start" aria-hidden="true" />
              )}
              {isPending ? pendingLabel : actionLabel}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Issued</p>
              <p className="mt-2 text-sm font-medium tabular-nums">{formatDate(tokenStatus.createdAt)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Rotated</p>
              <p className="mt-2 text-sm font-medium tabular-nums">{formatDate(tokenStatus.rotatedAt)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Used</p>
              <p className="mt-2 text-sm font-medium tabular-nums">{formatDate(tokenStatus.lastUsedAt)}</p>
            </div>
          </div>

          <Alert>
            <KeyRound aria-hidden="true" />
            <AlertTitle>Visibility Rule</AlertTitle>
            <AlertDescription>
              We only show the token right after create or rotate. Copy it before leaving this page or rotating it again.
            </AlertDescription>
          </Alert>

          {revealedToken ? (
            <Card size="sm" className="border-dashed">
              <CardHeader className="gap-1">
                <CardTitle>Copy the New Token</CardTitle>
                <CardDescription>
                  This value will not be shown again after you leave the page.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row">
                <Input
                  value={revealedToken}
                  readOnly
                  name="revealed-token"
                  spellCheck={false}
                  className="font-mono text-xs sm:text-sm"
                />
                <Button variant="outline" onClick={() => void copyToken()}>
                  {copied ? (
                    <Check data-icon="inline-start" aria-hidden="true" />
                  ) : (
                    <Copy data-icon="inline-start" aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy Token"}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {feedback ? (
            <Alert
              variant={feedback.tone === "error" ? "destructive" : "default"}
              aria-live="polite"
            >
              <CircleAlert aria-hidden="true" />
              <AlertTitle>{feedback.tone === "error" ? "Token Update Failed" : "Token Updated"}</AlertTitle>
              <AlertDescription>{feedback.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
