"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

export type PronounceAccent = "us" | "uk" | "aus";

type WidgetEvents = {
  onFetchDone?: () => void;
  onFetchFail?: () => void;
};

type WidgetOptions = {
  autoStart?: 0 | 1;
  components?: number;
  events?: WidgetEvents;
};

type YouglishWidget = {
  fetch: (term: string, language?: string, accent?: string) => void;
  close?: () => void;
};

type YouglishNamespace = {
  Widget: new (containerId: string, options?: WidgetOptions) => YouglishWidget;
};

declare global {
  interface Window {
    YG?: YouglishNamespace;
    onYouglishAPIReady?: () => void;
  }
}

const YOUGLISH_SCRIPT_ID = "youglish-js-api";
const YOUGLISH_COMPONENTS = 732;

let youglishLoader: Promise<YouglishNamespace> | null = null;

function loadYouglish() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouGlish is only available in the browser."));
  }

  if (window.YG) {
    return Promise.resolve(window.YG);
  }

  if (youglishLoader) {
    return youglishLoader;
  }

  youglishLoader = new Promise<YouglishNamespace>((resolve, reject) => {
    const existingScript = document.getElementById(YOUGLISH_SCRIPT_ID) as HTMLScriptElement | null;
    const previousReady = window.onYouglishAPIReady;

    window.onYouglishAPIReady = () => {
      previousReady?.();
      if (window.YG) {
        resolve(window.YG);
        return;
      }
      reject(new Error("YouGlish API loaded without a widget namespace."));
    };

    if (existingScript) {
      existingScript.addEventListener("error", () => {
        youglishLoader = null;
        reject(new Error("Failed to load the YouGlish script."));
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = YOUGLISH_SCRIPT_ID;
    script.async = true;
    script.src = "https://youglish.com/public/emb/widget.js";
    script.addEventListener(
      "error",
      () => {
        youglishLoader = null;
        reject(new Error("Failed to load the YouGlish script."));
      },
      { once: true }
    );
    document.head.appendChild(script);
  });

  return youglishLoader;
}

function normalizeAccent(accent: PronounceAccent) {
  if (accent === "aus") return "aus";
  return accent;
}

interface PronounceWidgetProps {
  term: string;
  accent: PronounceAccent;
}

export function PronounceWidget({ term, accent }: PronounceWidgetProps) {
  const containerId = `youglish-${useId().replace(/:/g, "")}`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<YouglishWidget | null>(null);
  const mountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const container = containerRef.current;
    return () => {
      mountedRef.current = false;
      widgetRef.current = null;
      if (container) {
        container.replaceChildren();
      }
    };
  }, []);

  useEffect(() => {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) {
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    let cancelled = false;

    loadYouglish()
      .then((YG) => {
        if (cancelled) return;

        if (!widgetRef.current) {
          widgetRef.current = new YG.Widget(containerId, {
            autoStart: 0,
            components: YOUGLISH_COMPONENTS,
            events: {
              onFetchDone: () => {
                if (!mountedRef.current) return;
                setHasError(false);
                setIsLoading(false);
              },
              onFetchFail: () => {
                if (!mountedRef.current) return;
                setHasError(true);
                setIsLoading(false);
              }
            }
          });
        }

        widgetRef.current.fetch(normalizedTerm, "english", normalizeAccent(accent));
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accent, containerId, term]);

  return (
    <div className="widget-shell relative min-h-[360px] overflow-hidden rounded-[28px] border border-border/70 bg-white/70 p-3">
      {isLoading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/70 text-sm text-muted-foreground backdrop-blur-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading pronunciation clips...
        </div>
      ) : null}

      {hasError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 px-6 text-center text-sm text-muted-foreground backdrop-blur-sm">
          YouGlish could not load right now. Try switching accent or refreshing the page.
        </div>
      ) : null}

      <div ref={containerRef} id={containerId} className="min-h-[332px] min-w-[200px]" />
    </div>
  );
}
