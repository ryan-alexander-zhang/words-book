"use client";

import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
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
    return "Not available";
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
          setFeedback(error instanceof Error ? error.message : "Unable to update the API token.");
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
      setFeedback("API token copied to the clipboard.");
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
              API access
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Generate a single bearer token for Raycast, browser extensions, local scripts, and
              third-party automation. Resetting the token invalidates the previous value
              immediately.
            </p>
          </div>

          <div className="settings-grid">
            <article className="settings-card">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Account
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
                      Your workspace and API token are isolated to this Google account.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="settings-card">
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      API token
                    </p>
                    <h2 className="text-xl font-semibold text-foreground">
                      {tokenStatus.hasToken ? "Token is active" : "No token created yet"}
                    </h2>
                  </div>

                  <Button onClick={rotateToken} disabled={isPending}>
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {tokenStatus.hasToken ? "Reset token" : "Create token"}
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="settings-stat">
                    <span className="settings-stat__label">Created</span>
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
                  The raw token is never stored in plaintext. After creation or reset, it will be
                  shown once below and cannot be recovered later.
                </p>
              </div>
            </article>
          </div>

          <section className="settings-card space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">One-time token reveal</h2>
              <p className="text-sm text-muted-foreground">
                Copy the token now and save it in your script runner, password manager, or third-party
                integration settings.
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
                  Use it as <code>Authorization: Bearer &lt;token&gt;</code> when calling
                  <code> /api/v1/words</code>.
                </div>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-border/75 bg-white/60 px-5 py-8 text-sm leading-6 text-muted-foreground">
                No plaintext token is currently shown. Create or reset the token to reveal a new
                bearer value once.
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
              External usage
            </p>
            <h2 className="display-font text-3xl leading-none text-foreground">Bearer API</h2>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-white/75 p-4 font-mono text-xs leading-6 text-foreground sm:text-sm">
            <p>POST /api/v1/words</p>
            <p>GET /api/v1/words</p>
            <p className="mt-3 text-muted-foreground">Authorization: Bearer &lt;token&gt;</p>
          </div>

          <div className="rounded-[24px] border border-border/70 bg-white/75 p-4 text-sm leading-6 text-muted-foreground">
            <p>
              Input is normalized to lowercase and duplicate additions are ignored per account.
            </p>
            <p className="mt-3">
              Reset the token if it leaks. Old bearer values stop working immediately.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
