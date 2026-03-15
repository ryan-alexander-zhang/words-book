"use client";

import { type ReactNode, useState, useTransition } from "react";
import { Check, CircleHelp, Copy, KeyRound, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ApiTokenStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type TokenSettingsProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
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

function getUserInitials(user: TokenSettingsProps["user"]) {
  const source = user.name?.trim() || user.email?.trim() || "wb";
  return source.slice(0, 2).toUpperCase();
}

async function readTokenResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as TokenResponse | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }

  return payload ?? {};
}

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

export function TokenSettings({ user, initialTokenStatus }: TokenSettingsProps) {
  const [tokenStatus, setTokenStatus] = useState(initialTokenStatus);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const avatarStyle = user.image ? { backgroundImage: `url(${user.image})` } : undefined;
  const accountLabel = user.name || user.email || "Google account";

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
          setFeedback(
            error instanceof Error ? error.message : "Unable to update the access credential."
          );
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
      setFeedback("Access credential copied to the clipboard.");
    } catch {
      setFeedback("Clipboard access is not available in this browser.");
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
      <section className="study-panel px-5 py-6 sm:px-6">
        <div className="relative z-10 space-y-5">
          <div className="space-y-2">
            <span className="hero-kicker">
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              Settings
            </span>
            <h1 className="display-font text-4xl leading-none tracking-tight text-foreground">
              Access credentials
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Issue the credential that lets Raycast, extensions, and scripts work with your
              private word library. Rotate it whenever you need to cut off older connections.
            </p>
          </div>

          <div className="settings-grid">
            <article className="settings-card">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Workspace account
                </p>
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "account-chip__avatar h-14 w-14 text-base",
                      user.image && "account-chip__avatar--image"
                    )}
                    style={avatarStyle}
                    aria-hidden="true"
                  >
                    {!user.image ? getUserInitials(user) : null}
                  </span>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">{accountLabel}</p>
                    <p className="text-sm text-muted-foreground">
                      Your library and access credential stay scoped to this signed-in account.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="settings-card">
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                        Access credential
                      </p>
                      <h2 className="text-xl font-semibold text-foreground">
                        {tokenStatus.hasToken ? "Credential is active" : "No credential issued yet"}
                      </h2>
                    </div>
                    <DeveloperReferenceHint />
                  </div>

                  <Button onClick={rotateToken} disabled={isPending}>
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {tokenStatus.hasToken ? "Rotate credential" : "Create credential"}
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

                <p className="text-sm leading-6 text-muted-foreground">
                  This credential is only shown when it is created or rotated. Save it before you
                  leave this page or you will need to rotate again to get a fresh value.
                </p>
              </div>
            </article>
          </div>

          <section className="settings-card space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Credential reveal</h2>
              <p className="text-sm text-muted-foreground">
                Copy this value now and place it in Raycast, extension settings, your password
                manager, or local tooling before moving on.
              </p>
            </div>

            {revealedToken ? (
              <div className="space-y-3">
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

                <div className="rounded-[22px] border border-border/70 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
                  This credential is ready to paste into any external tool that adds words on your
                  behalf.
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-border/75 bg-white/60 px-5 py-8 text-sm leading-6 text-muted-foreground">
                No credential is currently visible. Create or rotate one to reveal a fresh value a
                single time.
              </div>
            )}

            {feedback ? (
              <div className="rounded-[20px] border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted-foreground">
                {feedback}
              </div>
            ) : null}
          </section>
        </div>
      </section>

      <aside className="study-panel px-5 py-6 sm:px-6 xl:sticky xl:top-6 xl:self-start">
        <div className="relative z-10 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Developer access
            </p>
            <h2 className="display-font text-3xl leading-none text-foreground">Connect your tools</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Use one credential across Raycast, browser extensions, and your own scripts without
              crowding the main settings flow with protocol details. When you need request format
              details, open the help icon beside the credential status.
            </p>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-white/75 p-4 text-sm leading-6 text-muted-foreground">
            <p>
              Word additions are normalized automatically and duplicate saves are ignored inside
              this account.
            </p>
            <p className="mt-3">
              Rotate the credential immediately if it appears in logs, screenshots, or shared
              configs. Older values stop working right away.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
