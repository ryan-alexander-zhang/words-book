import { getPreferenceValues } from "@raycast/api";

export type Word = {
  id: number;
  name: string;
  createdAt?: string;
};

type Preferences = {
  apiBaseUrl: string;
  randomCount: string;
};

export function getApiBaseUrl(): string {
  const { apiBaseUrl } = getPreferenceValues<Preferences>();
  return apiBaseUrl.replace(/\/$/, "");
}

export function getRandomCount(): number {
  const { randomCount } = getPreferenceValues<Preferences>();
  const parsed = Number.parseInt(randomCount, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? 5 : parsed;
}

export async function fetchWords(): Promise<Word[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/words`);
  if (!response.ok) {
    throw new Error(`Failed to load words (${response.status})`);
  }
  const data = (await response.json()) as { words?: Word[] };
  return data.words ?? [];
}

export async function addWord(name: string): Promise<Word[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/words`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Failed to add word (${response.status})`);
  }

  const data = (await response.json()) as { words?: Word[] };
  return data.words ?? [];
}

