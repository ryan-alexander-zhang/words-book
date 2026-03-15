export const WORD_MAX_LENGTH = 80;
export const WORD_VALIDATION_HELP_TEXT =
  "Letters, spaces, hyphens, and apostrophes only.";

const WORD_PATTERN = /^[a-z]+(?:[ '-][a-z]+)*$/;

export function normalizeWordName(value: string) {
  return value.trim().toLowerCase();
}

export function getWordValidationError(value: string) {
  const normalized = normalizeWordName(value);

  if (!normalized) {
    return "Word is required.";
  }

  if (normalized.length > WORD_MAX_LENGTH) {
    return `Words must be ${WORD_MAX_LENGTH} characters or fewer.`;
  }

  if (!WORD_PATTERN.test(normalized)) {
    return "Words may only contain letters, spaces, hyphens, and apostrophes.";
  }

  return null;
}

export function getWordsValidationError(values: string[]) {
  let hasValidCandidate = false;

  for (const value of values) {
    const normalized = normalizeWordName(value);
    if (!normalized) {
      continue;
    }

    hasValidCandidate = true;
    const error = getWordValidationError(normalized);
    if (error) {
      return error;
    }
  }

  return hasValidCandidate ? null : "Word is required.";
}

export function normalizeValidatedWordNames(values: string[]) {
  const error = getWordsValidationError(values);
  if (error) {
    throw new Error(error);
  }

  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const value of values) {
    const normalized = normalizeWordName(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    cleaned.push(normalized);
  }

  return cleaned;
}
