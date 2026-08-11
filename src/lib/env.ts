/**
 * Environment access.
 *
 * Everything here is read lazily so that `next build` succeeds on a machine
 * that has no secrets configured (Vercel builds before env vars are attached,
 * and contributors should be able to typecheck without a database).
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required('DATABASE_URL');
  },

  get adminPasscode() {
    const passcode = required('ADMIN_PASSCODE');
    if (passcode.length < 12) {
      throw new Error(
        'ADMIN_PASSCODE must be at least 12 characters. A short passcode on a public URL is not worth much.',
      );
    }
    return passcode;
  },

  get sessionSecret() {
    return required('SESSION_SECRET');
  },

  get elevenLabsApiKey() {
    return required('ELEVENLABS_API_KEY');
  },
};

/**
 * Absolute origin of this deployment, used for certificate links and QR codes.
 * Prefers an explicitly configured domain so that links printed on a PDF keep
 * working after the underlying deployment URL rotates.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}
