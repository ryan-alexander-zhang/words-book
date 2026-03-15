export type WordItem = {
  id: number;
  name: string;
  createdAt: string;
};

export type ApiTokenStatus = {
  hasToken: boolean;
  createdAt: string | null;
  rotatedAt: string | null;
  lastUsedAt: string | null;
};
