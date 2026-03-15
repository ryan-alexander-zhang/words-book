import { getPreferenceValues } from "@raycast/api";

export type Word = {
  id: number;
  name: string;
  createdAt?: string;
};

type Preferences = {
  apiBaseUrl: string;
  apiToken: string;
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

function getApiToken() {
  const { apiToken } = getPreferenceValues<Preferences>();
  const trimmed = apiToken.trim();

  if (!trimmed) {
    throw new Error("Missing API token. Generate one in Words Book settings and paste it into Raycast preferences.");
  }

  return trimmed;
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${getApiToken()}`
  };
}

export async function fetchWords(): Promise<Word[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/words`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Failed to load words (${response.status})`);
  }
  const data = (await response.json()) as { words?: Word[] };
  return data.words ?? [];
}

export async function addWord(name: string): Promise<Word[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/words`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
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
