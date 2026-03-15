"use client";

import { type ReactNode, useState, useTransition } from "react";
import { Check, CircleHelp, Copy, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ApiTokenStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type TokenSettingsProps = {
  initialTokenStatus: ApiTokenStatus;
};

type TokenResponse = {
  token?: ApiTokenStatus;
  value?: string;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

async function readTokenResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as TokenResponse | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }

  return payload ?? {};
}

type FeedbackState =
  | {
      tone: "error" | "info";
      message: string;
    }
  | null;

type InfoHintProps = {
  align?: "left" | "right";
  children: ReactNode;
  label: string;
};

function InfoHint({ align = "left", children, label }: InfoHintProps) {
  return (
    <div className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-white/80 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <CircleHelp className="h-4 w-4" aria-hidden="true" />
      </button>

      <div
        className={cn(
          "pointer-events-none absolute top-full z-20 mt-2 w-72 rounded-[22px] border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,239,231,0.96))] p-4 text-left text-xs leading-6 text-foreground opacity-0 shadow-[0_22px_48px_-30px_rgba(54,39,24,0.42)] transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100",
          align === "right" ? "right-0" : "left-0"
        )}
        role="note"
      >
        {children}
      </div>
    </div>
  );
}

function DeveloperReferenceHint({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <InfoHint align={align} label="Show developer reference">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        Developer reference
      </p>
      <div className="mt-2 space-y-2">
        <p>
          Header: <code>Authorization: Bearer &lt;token&gt;</code>
        </p>
        <p>
          Endpoint: <code>/api/v1/words</code>
        </p>
        <p>
          Methods: <code>GET</code> to read words, <code>POST</code> to send new words.
        </p>
      </div>
    </InfoHint>
  );
}

export function TokenSettings({ initialTokenStatus }: TokenSettingsProps) {
  const [tokenStatus, setTokenStatus] = useState(initialTokenStatus);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const actionLabel = tokenStatus.hasToken ? "Rotate credential" : "Create credential";
  const pendingLabel = tokenStatus.hasToken ? "Rotating..." : "Creating...";

  const rotateToken = () => {
    setFeedback(null);
    setCopied(false);

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/settings/token", {
            method: "POST"
          });
          const payload = await readTokenResponse(response);
          if (payload.token) {
            setTokenStatus(payload.token);
          }
          setRevealedToken(payload.value ?? null);
        } catch (error) {
          setFeedback({
            tone: "error",
            message:
              error instanceof Error ? error.message : "Unable to update the access credential."
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
        message: "Access credential copied to the clipboard."
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Clipboard access is not available in this browser."
      });
    }
  };

  return (
    <section className="study-panel px-5 py-6 sm:px-6">
      <div className="relative z-10 mx-auto max-w-3xl space-y-5">
        <div className="space-y-2">
          <span className="hero-kicker">
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            Settings
          </span>
          <h1 className="display-font text-4xl leading-none tracking-tight text-foreground">
            Access credentials
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Create or rotate the credential that trusted tools use to access this workspace.
          </p>
        </div>

        <article className="settings-card space-y-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Access credential
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {tokenStatus.hasToken ? "Active" : "Not created yet"}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                Applies to your current signed-in workspace.
              </p>
            </div>

            <Button onClick={rotateToken} disabled={isPending} className="sm:min-w-[190px]">
              <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} aria-hidden="true" />
              {isPending ? pendingLabel : actionLabel}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="settings-stat">
              <span className="settings-stat__label">Issued</span>
              <span className="settings-stat__value">{formatDate(tokenStatus.createdAt)}</span>
            </div>
            <div className="settings-stat">
              <span className="settings-stat__label">Last rotated</span>
              <span className="settings-stat__value">{formatDate(tokenStatus.rotatedAt)}</span>
            </div>
            <div className="settings-stat">
              <span className="settings-stat__label">Last used</span>
              <span className="settings-stat__value">{formatDate(tokenStatus.lastUsedAt)}</span>
            </div>
          </div>

          <div className="settings-inline-note">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Visibility rule
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                The credential is only shown after create or rotate. Copy it before leaving or
                rotating again.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start sm:self-center">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Developer reference
              </span>
              <DeveloperReferenceHint align="right" />
            </div>
          </div>

          {revealedToken ? (
            <div className="settings-reveal">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">Copy credential now</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Copy this now. It will not be shown again after you leave or rotate.
                </p>
              </div>

              <div className="token-reveal-row">
                <Input value={revealedToken} readOnly className="font-mono text-xs sm:text-sm" />
                <Button variant="outline" onClick={() => void copyToken()}>
                  {copied ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ) : null}

          {feedback ? (
            <div
              className={cn(
                "rounded-[20px] border px-4 py-3 text-sm",
                feedback.tone === "error"
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-border/70 bg-white/70 text-muted-foreground"
              )}
            >
              {feedback.message}
            </div>
          ) : null}
        </article>
      </div>
    </section>
  );
}
