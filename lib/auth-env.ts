const AUTH_ENV_ERRORS = {
  AUTH_SECRET: "AUTH_SECRET must be set to a strong random value in production.",
  AUTH_GOOGLE_ID: "AUTH_GOOGLE_ID must be set to a real Google OAuth client ID in production.",
  AUTH_GOOGLE_SECRET: "AUTH_GOOGLE_SECRET must be set to a real Google OAuth client secret in production."
} as const;

const AUTH_ENV_PLACEHOLDERS = {
  AUTH_SECRET: new Set(["local-development-secret-change-me", "replace-with-a-long-random-string"]),
  AUTH_GOOGLE_ID: new Set(["replace-with-google-client-id"]),
  AUTH_GOOGLE_SECRET: new Set(["replace-with-google-client-secret"])
} as const;

export function assertValidAuthEnv() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  for (const [key, message] of Object.entries(AUTH_ENV_ERRORS) as Array<
    [keyof typeof AUTH_ENV_ERRORS, string]
  >) {
    const value = process.env[key]?.trim();

    if (!value || AUTH_ENV_PLACEHOLDERS[key].has(value)) {
      throw new Error(message);
    }
  }
}
