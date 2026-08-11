import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * One row per awards event, e.g. "Curious Minds 2026".
 *
 * The narration templates live here rather than in code so the Vividha team can
 * reword what the certificate says without a deploy.
 */
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  orgName: text('org_name').notNull().default('Vividha Trust'),
  eventDate: text('event_date'),
  venue: text('venue'),

  /**
   * Narration templates, keyed by language tag ("en-IN", "hi", "kn", ...).
   *
   * Per-language rather than a single set with a language code, because the
   * voice engine infers the spoken language from the text itself. A Hindi
   * certificate needs genuinely Hindi wording; there is no language flag that
   * makes English text come out as Hindi. See lib/script.ts for token syntax.
   */
  templates: jsonb('templates').$type<Record<string, TemplateSet>>().notNull(),

  voiceId: text('voice_id').notNull(),
  /** A specific model id, or "auto" to choose per language. See lib/languages.ts. */
  modelId: text('model_id').notNull().default('auto'),
  defaultLanguage: text('default_language').notNull().default('en-IN'),

  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const certificateStatuses = ['draft', 'generating', 'ready', 'failed'] as const;
export type CertificateStatus = (typeof certificateStatuses)[number];

export const certificates = pgTable(
  'certificates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Unguessable public-facing id used in /c/[publicId]. */
    publicId: text('public_id').notNull().unique(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),

    studentName: text('student_name').notNull(),
    /**
     * Optional phonetic respelling, e.g. "RUH-vee KOO-mar". When present this
     * is what gets sent to the voice engine; `studentName` is still what is
     * displayed and printed.
     */
    namePronunciation: text('name_pronunciation'),
    school: text('school'),
    city: text('city'),
    className: text('class_name'),
    projectTitle: text('project_title'),
    projectBlurb: text('project_blurb'),
    award: text('award').notNull(),
    language: text('language').notNull().default('en-IN'),

    audioUrl: text('audio_url'),
    audioDurationMs: integer('audio_duration_ms'),
    pdfUrl: text('pdf_url'),
    imageUrl: text('image_url'),

    status: text('status').$type<CertificateStatus>().notNull().default('draft'),
    errorMessage: text('error_message'),
    /** Ticked by the operator after they have actually listened to the result. */
    reviewed: boolean('reviewed').notNull().default(false),

    /**
     * The exact spoken text, segment by segment. Kept so the on-page transcript
     * always matches the audio word for word, and so a certificate can be
     * regenerated identically years later even if the templates change.
     */
    scriptSnapshot: jsonb('script_snapshot').$type<ScriptSnapshot>(),

    sortIndex: integer('sort_index').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    generatedAt: timestamp('generated_at', { withTimezone: true }),
  },
  (table) => [
    index('certificates_event_idx').on(table.eventId, table.sortIndex),
    index('certificates_status_idx').on(table.eventId, table.status),
  ],
);

/**
 * Content-addressed cache of synthesised speech.
 *
 * Keyed on a hash of (text, voice, model, language, speed), so it serves three
 * purposes at once: the shared intro/closing lines are synthesised once per
 * event instead of once per student, name pronunciation previews are free after
 * the first play, and re-running a failed batch does not re-bill any segment
 * that already succeeded.
 */
export const ttsCache = pgTable(
  'tts_cache',
  {
    hash: text('hash').primaryKey(),
    url: text('url').notNull(),
    durationMs: integer('duration_ms'),
    /** Characters billed, so the admin can see credit usage per event. */
    chars: integer('chars').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('tts_cache_hash_idx').on(table.hash)],
);

/** The five pieces of wording that make up a certificate, in one language. */
export type TemplateSet = {
  intro: string;
  awardLine: string;
  citation: string;
  prize: string;
  closing: string;
};

/** A single spoken clip within a certificate. */
export type ScriptSegment = {
  /** Which beat of the score this is. Matches SEGMENT_IDS in lib/audio/score.ts. */
  id: 'intro' | 'awardLine' | 'name' | 'citation' | 'prize' | 'closing';
  /** What the listener hears, and what the transcript shows. */
  text: string;
  /**
   * What is actually sent to the voice engine. Differs from `text` only for the
   * name segment when a pronunciation override is set.
   */
  spoken: string;
  /** Speaking rate multiplier; the name is slowed down deliberately. */
  speed: number;
  /** True for segments shared by every certificate in the event. */
  shared: boolean;
};

export type ScriptSnapshot = {
  language: string;
  voiceId: string;
  modelId: string;
  segments: ScriptSegment[];
};

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
