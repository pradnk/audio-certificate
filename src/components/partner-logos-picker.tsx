'use client';

import { useRef, useState } from 'react';

import { Alert, Button, Field, Input } from '@/components/ui';
import {
  LOGO_CONTENT_TYPES,
  MAX_PARTNER_LOGOS,
  type PartnerLogo,
} from '@/lib/partners';

/**
 * Manages the row of co-organiser and supporter logos.
 *
 * Fully controlled, like LogoPicker, so the settings form keeps one source of
 * truth and nothing is written until Save. Uploads reuse /api/admin/logo
 * unchanged: it already checks the type and size, is not tied to an event, and
 * adds a random suffix to every stored name, so calling it repeatedly is safe.
 */
export function PartnerLogosPicker({
  logos,
  disabled,
  onChange,
}: {
  logos: PartnerLogo[];
  disabled?: boolean;
  onChange: (next: PartnerLogo[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const full = logos.length >= MAX_PARTNER_LOGOS;

  const add = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/admin/logo', { method: 'POST', body: form });
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) {
        throw new Error(body.error ?? `Upload failed (${response.status}).`);
      }
      // The name is left blank on purpose: it is the next thing to fill in, and
      // guessing one from the file name would produce "htbf-logo" on a
      // certificate's alt text.
      onChange([...logos, { url: body.url, name: '' }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not upload that image.');
    } finally {
      setUploading(false);
      // Let the same file be picked again after a failure.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const rename = (index: number, name: string) =>
    onChange(logos.map((logo, position) => (position === index ? { ...logo, name } : logo)));

  const remove = (index: number) => onChange(logos.filter((_, position) => position !== index));

  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= logos.length) return;
    const next = [...logos];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}

      {logos.length > 0 && (
        <ol className="flex flex-col gap-4">
          {logos.map((logo, index) => (
            <li
              key={logo.url}
              className="flex flex-wrap items-end gap-4 rounded-lg border-2 border-line p-4"
            >
              <span className="flex h-16 w-28 shrink-0 items-center justify-center bg-paper">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary Blob or static URL; next/image cannot size an untyped host */}
                <img src={logo.url} alt="" className="max-h-16 max-w-28 object-contain" />
              </span>

              <div className="min-w-56 flex-1">
                <Field
                  id={`partner-name-${index}`}
                  label={`Organisation ${index + 1}`}
                  hint="Never printed. It is what a screen reader reads out in place of the logo."
                  error={logo.name.trim() ? undefined : 'Needed — a logo with no name is dropped when you save.'}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={logo.name}
                      onChange={(e) => rename(index, e.target.value)}
                      autoComplete="off"
                      placeholder="Vision Empower"
                    />
                  )}
                </Field>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => move(index, -1)}
                  disabled={disabled || index === 0}
                  aria-label={`Move ${logo.name.trim() || `organisation ${index + 1}`} earlier`}
                >
                  ↑
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => move(index, 1)}
                  disabled={disabled || index === logos.length - 1}
                  aria-label={`Move ${logo.name.trim() || `organisation ${index + 1}`} later`}
                >
                  ↓
                </Button>
                <Button
                  variant="danger"
                  onClick={() => remove(index)}
                  disabled={disabled}
                  aria-label={`Remove ${logo.name.trim() || `organisation ${index + 1}`}`}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Field
        id="partner-logo-file"
        label={logos.length === 0 ? 'Add a logo' : 'Add another logo'}
        hint="PNG, JPEG, WebP or SVG, under 2 MB. A version with a transparent or white background works best — the certificate is white."
      >
        {(props) => (
          <input
            {...props}
            ref={inputRef}
            type="file"
            accept={LOGO_CONTENT_TYPES.join(',')}
            disabled={disabled || full}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void add(file);
            }}
            className="min-h-11 w-full rounded-lg border-2 border-line bg-paper px-3 py-2"
          />
        )}
      </Field>

      {uploading && <p aria-live="polite">Uploading…</p>}
      {full && (
        <p className="text-ink-soft">
          That is {MAX_PARTNER_LOGOS} logos — enough for a row. Remove one to add another.
        </p>
      )}
    </div>
  );
}
