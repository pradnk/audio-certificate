'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { setEventArchived, updateEvent, type EventSettings } from '@/app/admin/actions';
import { LogoPicker } from '@/components/logo-picker';
import { PartnerLogosPicker } from '@/components/partner-logos-picker';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '@/components/ui';
import { DEFAULT_AWARDS, normaliseAwards } from '@/lib/awards';
import type { Event, TemplateSet } from '@/lib/db/schema';
import { normalisePartnerLogos } from '@/lib/partners';
import type { ElevenLabsVoice } from '@/lib/elevenlabs';
import {
  DEFAULT_TEMPLATES,
  LANGUAGES_NEEDING_REVIEW,
  MODEL_AUTO,
  MODEL_MULTILINGUAL_V2,
  MODEL_V3,
  SUPPORTED_LANGUAGES,
  languageLabel,
  pickModelFor,
  resolveModel,
} from '@/lib/languages';

const EMPTY_TEMPLATE: TemplateSet = {
  intro: '',
  awardLine: '',
  citation: '',
  prize: '',
  closing: '',
};

const TEMPLATE_FIELDS: Array<{
  key: keyof TemplateSet;
  label: string;
  hint: string;
  rows: number;
}> = [
  {
    key: 'intro',
    label: 'Opening line',
    hint: 'Spoken first, after the chime. The same for every student, so it is only recorded once.',
    rows: 2,
  },
  {
    key: 'awardLine',
    label: 'Lead-in to the name',
    hint: 'Deliberately has no full stop — it should lead into the name, not land.',
    rows: 1,
  },
  {
    key: 'citation',
    label: 'What they did',
    hint: 'Spoken after the name. Anything inside [[double brackets]] disappears if its details are missing.',
    rows: 2,
  },
  { key: 'prize', label: 'The prize', hint: 'Spoken after the drum roll.', rows: 1 },
  {
    key: 'closing',
    label: 'Closing line',
    hint: 'Spoken over the applause. Also the same for every student.',
    rows: 2,
  },
];

/**
 * Speaks a sample line in the selected voice.
 *
 * Worth the space it takes: a voice can be listed on the account and still be
 * refused at synthesis time -- Voice Library voices need a paid ElevenLabs
 * plan, for instance -- and without this the first anyone learns of it is a row
 * of failed certificates. One click here settles both whether the voice works
 * and whether it says an Indian name properly.
 */
function VoiceTest({ voiceId, modelId }: { voiceId: string; modelId: string }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  const SAMPLE = 'This certificate is awarded to Ravi Kumar. First Prize.';

  const play = async () => {
    setBusy(true);
    setProblem('');
    try {
      const response = await fetch('/api/admin/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId,
          modelId,
          segments: [{ id: 'name', spoken: SAMPLE, speed: 1 }],
        }),
      });
      const body = (await response.json()) as { clips?: Array<{ url: string }>; error?: string };
      if (!response.ok || !body.clips?.[0]) {
        throw new Error(body.error ?? `The voice service returned ${response.status}.`);
      }
      const audio = new Audio(body.clips[0].url);
      audio.addEventListener('ended', () => setBusy(false), { once: true });
      await audio.play();
    } catch (caught) {
      setProblem(caught instanceof Error ? caught.message : 'Could not play the sample.');
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={play} disabled={busy}>
          {busy ? '♪ Playing…' : '♪ Test this voice'}
        </Button>
        <span className="text-ink-soft">“{SAMPLE}”</span>
      </div>
      {problem && <Alert>{problem}</Alert>}
    </div>
  );
}

const TOKENS = [
  '{{event}}',
  '{{org}}',
  '{{name}}',
  '{{location}}',
  '{{school}}',
  '{{city}}',
  '{{class}}',
  '{{projectTitle}}',
  '{{blurb}}',
  '{{award}}',
];

export function SettingsForm({
  event,
  voices,
  voicesError,
}: {
  event: Event;
  voices: ElevenLabsVoice[];
  voicesError?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState<EventSettings>({
    name: event.name,
    orgName: event.orgName,
    eventDate: event.eventDate,
    venue: event.venue,
    voiceId: event.voiceId,
    modelId: event.modelId,
    defaultLanguage: event.defaultLanguage,
    logoUrl: event.logoUrl,
    logoPosition: event.logoPosition,
    templates: event.templates,
    // The stored list as it is, not `awardsFor` -- an event whose categories
    // have been cleared should look cleared here, even though the add-student
    // screens fall back to the standard list rather than offering nothing.
    awards: event.awards,
    partnerLogos: event.partnerLogos,
  });

  const archived = Boolean(event.archivedAt);

  const [activeLanguage, setActiveLanguage] = useState(event.defaultLanguage);
  const activeTemplates = settings.templates[activeLanguage] ?? EMPTY_TEMPLATE;

  const update = <K extends keyof EventSettings>(key: K, value: EventSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const updateTemplate = (field: keyof TemplateSet, value: string) => {
    setSettings((current) => ({
      ...current,
      templates: {
        ...current.templates,
        [activeLanguage]: { ...(current.templates[activeLanguage] ?? EMPTY_TEMPLATE), [field]: value },
      },
    }));
    setSaved(false);
  };

  const save = () => {
    setError('');

    // Clean the categories here as well as on the server, and keep the result,
    // so the form ends up showing the list that was actually stored. Without
    // this the blank and duplicate rows the server drops stay on screen after
    // "Saved.", which reads as the save not having taken.
    const cleaned: EventSettings = {
      ...settings,
      awards: normaliseAwards(settings.awards),
      partnerLogos: normalisePartnerLogos(settings.partnerLogos),
    };
    setSettings(cleaned);

    startTransition(async () => {
      try {
        await updateEvent(event.id, cleaned);
        setSaved(true);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not save.');
      }
    });
  };

  const hasWording = Boolean(settings.templates[activeLanguage]?.intro?.trim());
  const needsReview = LANGUAGES_NEEDING_REVIEW.includes(activeLanguage);
  const hasIndianVoice = voices.some((voice) =>
    (voice.labels?.accent ?? '').toLowerCase().includes('indian'),
  );
  const selectedVoice = voices.find((voice) => voice.voice_id === settings.voiceId);

  return (
    <div className="flex flex-col gap-8">
      {error && <Alert>{error}</Alert>}

      {archived && (
        <p className="rounded-lg border-2 border-line bg-paper-sunk px-5 py-4 text-lg">
          <strong>This event is marked complete.</strong> Its settings and students are locked
          against changes. The certificate links still work and always will — reopen the event below
          if you need to change something.
        </p>
      )}

      {/* One disabled fieldset rather than a `disabled` prop on twenty
          controls: it is the native way to switch off a whole form section,
          browsers apply it to every descendant, and screen readers announce
          the controls as unavailable without any extra ARIA. */}
      <fieldset disabled={archived} className="contents">

      <Card>
        <h2 className="mb-5 text-xl font-bold">About the event</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="name"
            label="Event name"
            hint="Spoken at the start of every certificate."
          >
            {(props) => (
              <Input {...props} value={settings.name} onChange={(e) => update('name', e.target.value)} />
            )}
          </Field>

          <Field id="orgName" label="Organisation">
            {(props) => (
              <Input
                {...props}
                value={settings.orgName}
                onChange={(e) => update('orgName', e.target.value)}
              />
            )}
          </Field>

          <Field id="eventDate" label="Date (optional)" hint="Shown on the certificate page.">
            {(props) => (
              <Input
                {...props}
                value={settings.eventDate ?? ''}
                onChange={(e) => update('eventDate', e.target.value)}
                placeholder="23–24 November 2026"
              />
            )}
          </Field>

          <Field id="venue" label="Venue (optional)">
            {(props) => (
              <Input
                {...props}
                value={settings.venue ?? ''}
                onChange={(e) => update('venue', e.target.value)}
              />
            )}
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="mb-5 text-xl font-bold">Logo</h2>
        <LogoPicker
          logoUrl={settings.logoUrl}
          logoPosition={settings.logoPosition}
          disabled={archived}
          onChange={(next) => {
            setSettings((current) => ({ ...current, ...next }));
            setSaved(false);
          }}
        />
      </Card>

      <Card>
        <h2 className="mb-2 text-xl font-bold">Other organisations</h2>
        <p className="mb-5 text-ink-soft">
          Anyone running the event alongside you, or supporting it. Their logos appear in a row at
          the foot of the printed certificate and on the certificate page. They are never spoken —
          the recording stays about the person receiving the award.
        </p>
        <PartnerLogosPicker
          logos={settings.partnerLogos}
          disabled={archived}
          onChange={(next) => update('partnerLogos', next)}
        />
      </Card>

      <Card>
        <h2 className="mb-5 text-xl font-bold">Voice</h2>

        {voices.length > 0 && !selectedVoice && (
          <Alert>
            The voice this event was set up with is no longer on the ElevenLabs account. Pick
            another below and save, or every certificate will fail.
          </Alert>
        )}

        {selectedVoice?.category === 'professional' && (
          <p className="mb-4 rounded-lg border-2 border-focus bg-teal-50 px-4 py-3">
            <strong>{selectedVoice.name} came from the Voice Library.</strong> Those need a paid
            ElevenLabs plan to use over the API — on a free plan every certificate will fail. Press{' '}
            <strong>Test this voice</strong> below to check before running a batch.
          </p>
        )}

        {voices.length > 0 && !hasIndianVoice && (
          <p className="mb-4 rounded-lg border-2 border-focus bg-teal-50 px-4 py-3">
            <strong>No Indian-accented voice is available on this account.</strong> The voices here
            are American, British and Australian, which will read Indian names with the wrong
            stress. Add one free from the{' '}
            <a
              href="https://elevenlabs.io/app/voice-library?accent=indian"
              className="font-bold text-teal-900 underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              ElevenLabs Voice Library
            </a>{' '}
            — search for an Indian English voice, click Add, then reload this page.
          </p>
        )}

        {voicesError && (
          <p className="mb-4 rounded-lg border-2 border-danger bg-danger-bg px-4 py-3 text-danger">
            {voicesError} You can still paste a voice ID below.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            id="voiceId"
            label="Reading voice"
            hint="Pick one that reads Indian names naturally. Try a name on the students page before doing a whole batch."
          >
            {(props) =>
              voices.length > 0 ? (
                <Select
                  {...props}
                  value={settings.voiceId}
                  onChange={(e) => update('voiceId', e.target.value)}
                >
                  {voices.every((voice) => voice.voice_id !== settings.voiceId) && (
                    <option value={settings.voiceId}>Current voice ({settings.voiceId})</option>
                  )}
                  {voices.map((voice) => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name}
                      {voice.labels?.accent ? ` — ${voice.labels.accent}` : ''}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  {...props}
                  value={settings.voiceId}
                  onChange={(e) => update('voiceId', e.target.value)}
                />
              )
            }
          </Field>

          <Field
            id="defaultLanguage"
            label="Default language"
            hint="Used for new students. Each student can be changed individually."
          >
            {(props) => (
              <Select
                {...props}
                value={settings.defaultLanguage}
                onChange={(e) => update('defaultLanguage', e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map((language) => (
                  <option key={language.tag} value={language.tag}>
                    {languageLabel(language.tag)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            id="modelId"
            label="Voice engine"
            hint="Choose automatically unless you have a reason not to. It picks the engine that can both speak the language and slow the student's name down."
          >
            {(props) => (
              <Select
                {...props}
                value={settings.modelId}
                onChange={(e) => update('modelId', e.target.value)}
              >
                <option value={MODEL_AUTO}>Choose automatically (recommended)</option>
                <option value={MODEL_MULTILINGUAL_V2}>
                  Multilingual v2 — English, Hindi, Tamil only
                </option>
                <option value={MODEL_V3}>v3 — every language, cannot slow the name down</option>
              </Select>
            )}
          </Field>
        </div>

        {settings.modelId === MODEL_AUTO && (
          <p className="mt-4 text-ink-soft">
            For {languageLabel(settings.defaultLanguage)} this will use{' '}
            <strong>{pickModelFor(settings.defaultLanguage)}</strong>.
          </p>
        )}

        <VoiceTest
          voiceId={settings.voiceId}
          modelId={resolveModel(settings.modelId, settings.defaultLanguage)}
        />
      </Card>

      <Card>
        <h2 className="mb-2 text-xl font-bold">Prize categories</h2>
        <p className="mb-5 text-ink-soft">
          The prizes this event hands out. They are offered when you add someone, and a pasted
          spreadsheet is checked against them — so a column reading “first prize” is corrected to
          the spelling you set here before it is printed and spoken.
        </p>
        <AwardCategories
          awards={settings.awards}
          disabled={archived}
          onChange={(next) => update('awards', next)}
        />
      </Card>

      <Card>
        <h2 className="mb-2 text-xl font-bold">What the certificate says</h2>
        <p className="mb-5 text-ink-soft">
          Each language needs its own wording — the voice engine works out which language to speak
          from the words themselves, so there is no setting that turns English into Hindi.
        </p>

        <div role="group" aria-label="Language to edit" className="mb-5 flex flex-wrap gap-2">
          {SUPPORTED_LANGUAGES.map((language) => {
            const filled = Boolean(settings.templates[language.tag]?.intro?.trim());
            return (
              <Button
                key={language.tag}
                variant={activeLanguage === language.tag ? 'primary' : 'secondary'}
                aria-pressed={activeLanguage === language.tag}
                className="min-h-11 px-3 text-sm"
                onClick={() => setActiveLanguage(language.tag)}
              >
                {language.englishName}
                {filled ? ' ✓' : ''}
              </Button>
            );
          })}
        </div>

        {!hasWording && (
          <div className="mb-5 rounded-lg border-2 border-line bg-paper-sunk p-4">
            <p className="mb-3 font-bold">
              No wording yet for {languageLabel(activeLanguage)}.
            </p>
            <p className="mb-3 text-ink-soft">
              Certificates cannot be made in this language until someone who speaks it writes the
              lines below. Machine translation is not offered on purpose: wording that reads
              awkwardly at an awards ceremony is worse than wording a person wrote.
            </p>
            {DEFAULT_TEMPLATES[activeLanguage] && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSettings((current) => ({
                    ...current,
                    templates: {
                      ...current.templates,
                      [activeLanguage]: { ...DEFAULT_TEMPLATES[activeLanguage] },
                    },
                  }));
                  setSaved(false);
                }}
              >
                Start from the built-in wording
              </Button>
            )}
          </div>
        )}

        {hasWording && needsReview && (
          <p className="mb-5 rounded-lg border-2 border-focus bg-teal-50 px-4 py-3">
            <strong>Please have a fluent speaker read this over.</strong> The built-in{' '}
            {languageLabel(activeLanguage)} wording is a starting draft, not a checked translation.
          </p>
        )}

        <div className="flex flex-col gap-5">
          {TEMPLATE_FIELDS.map((field) => (
            <Field
              key={field.key}
              id={`template-${field.key}`}
              label={field.label}
              hint={field.hint}
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={field.rows}
                  value={activeTemplates[field.key]}
                  onChange={(e) => updateTemplate(field.key, e.target.value)}
                  dir="auto"
                />
              )}
            </Field>
          ))}
        </div>

        <details className="mt-5">
          <summary className="min-h-11 cursor-pointer font-bold text-teal-900">
            Placeholders you can use
          </summary>
          <ul className="mt-3 flex flex-wrap gap-2">
            {TOKENS.map((token) => (
              <li key={token} className="rounded bg-paper-sunk px-2 py-1 font-mono text-sm">
                {token}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-ink-soft">
            <code className="font-mono">{'[[from {{school}}]]'}</code> — text in double brackets is
            dropped entirely when the details inside it are blank, so one line covers a student with
            a school and one without.
          </p>
        </details>
      </Card>

      <div className="flex items-center gap-4">
        <Button onClick={save} disabled={pending || archived}>
          {pending ? 'Saving…' : 'Save settings'}
        </Button>
        <span aria-live="polite" className="font-bold text-success">
          {saved && 'Saved.'}
        </span>
      </div>

      </fieldset>

      <ArchiveControl event={event} onError={setError} />
    </div>
  );
}

/**
 * Edits the list of prizes an event hands out.
 *
 * One input per category with its own Remove button, rather than a textarea of
 * one-per-line: the people who run these ceremonies are not editing a config
 * file, and a stray blank line in a textarea silently becomes a nameless prize.
 * Blank rows here are simply dropped when the list is saved.
 */
function AwardCategories({
  awards,
  disabled,
  onChange,
}: {
  awards: string[];
  disabled: boolean;
  onChange: (next: string[]) => void;
}) {
  const replace = (index: number, value: string) =>
    onChange(awards.map((award, position) => (position === index ? value : award)));

  const remove = (index: number) => onChange(awards.filter((_, position) => position !== index));

  // A duplicate is dropped on save, so say so while it is still fixable rather
  // than letting a category quietly disappear.
  const duplicates = new Set(
    awards
      .map((award) => award.trim().toLowerCase())
      .filter((award, index, all) => award && all.indexOf(award) !== index),
  );

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {awards.map((award, index) => (
          <li key={index} className="flex items-start gap-3">
            <div className="flex-1">
              <Input
                value={award}
                onChange={(e) => replace(index, e.target.value)}
                aria-label={`Prize category ${index + 1}`}
                aria-invalid={duplicates.has(award.trim().toLowerCase()) || undefined}
                autoComplete="off"
                placeholder="Best Team Effort"
              />
              {duplicates.has(award.trim().toLowerCase()) && (
                <p className="mt-1 text-sm text-danger">
                  Already in the list — the repeat will be dropped when you save.
                </p>
              )}
            </div>
            <Button
              variant="danger"
              onClick={() => remove(index)}
              aria-label={`Remove ${award.trim() || `prize category ${index + 1}`}`}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      {awards.length === 0 && (
        <p className="rounded-lg border-2 border-line bg-paper-sunk px-4 py-3 text-ink-soft">
          No categories yet, so the standard list is offered instead. Add your own below to replace
          it.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => onChange([...awards, ''])} disabled={disabled}>
          Add a category
        </Button>
        <Button
          variant="quiet"
          onClick={() => onChange([...DEFAULT_AWARDS])}
          disabled={disabled}
          className="px-2"
        >
          Restore the standard list
        </Button>
      </div>
    </div>
  );
}

/**
 * Marks an event complete, or reopens it.
 *
 * Placed last and styled quietly: it is a housekeeping action taken once, weeks
 * after the ceremony, not something anyone needs while preparing certificates.
 */
function ArchiveControl({
  event,
  onError,
}: {
  event: Event;
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const archived = Boolean(event.archivedAt);

  const toggle = () => {
    if (
      !archived &&
      !window.confirm(
        `Mark ${event.name} as complete?\n\nNo more students can be added and no certificates changed until you reopen it. All existing certificate links keep working.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await setEventArchived(event.id, !archived);
        router.refresh();
      } catch (caught) {
        onError(caught instanceof Error ? caught.message : 'Could not change the event state.');
      }
    });
  };

  return (
    <Card className="border-line bg-paper-sunk">
      <h2 className="mb-2 text-xl font-bold">{archived ? 'Reopen this event' : 'Finish up'}</h2>
      <p className="mb-4 text-ink-soft">
        {archived ? (
          <>
            Marked complete
            {event.archivedAt && ` on ${new Date(event.archivedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}`}
            . Reopening lets you add students and remake certificates again.
          </>
        ) : (
          <>
            Once the ceremony is over and every certificate has been sent out, mark the event
            complete. It moves out of the main list and is locked against accidental changes.
            Certificate links are unaffected — families keep them forever.
          </>
        )}
      </p>
      <Button variant={archived ? 'primary' : 'secondary'} onClick={toggle} disabled={pending}>
        {pending
          ? 'Saving…'
          : archived
            ? 'Reopen event'
            : 'Mark event as complete'}
      </Button>
    </Card>
  );
}
