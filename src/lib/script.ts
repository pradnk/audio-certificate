import type {
  Certificate,
  Event,
  ScriptSegment,
  ScriptSnapshot,
  TemplateSet,
} from '@/lib/db/schema';
import { modelSupportsSpeed, resolveModel, terminatorFor } from '@/lib/languages';

/**
 * Turns an event's wording templates plus one student's details into the exact
 * list of clips that will be spoken.
 *
 * Template syntax:
 *   {{token}}        substituted with the value, or "" if unset
 *   [[ ... ]]        an optional block: dropped entirely if any {{token}}
 *                    inside it is empty
 *
 * The optional block is what lets one template cover a student with no recorded
 * school and one with a school, a city and a project blurb, without the result
 * reading as "from , — for their exhibit, "".
 */

const TOKEN = /\{\{(\w+)\}\}/g;
const OPTIONAL_BLOCK = /\[\[(.*?)\]\]/gs;

export type ScriptVars = Record<string, string | null | undefined>;

export function renderTemplate(template: string, vars: ScriptVars): string {
  const substitute = (text: string) =>
    text.replace(TOKEN, (_match, name: string) => (vars[name] ?? '').toString().trim());

  const withOptionalBlocks = template.replace(OPTIONAL_BLOCK, (_match, inner: string) => {
    const tokens = [...inner.matchAll(TOKEN)].map((match) => match[1]);
    const anyEmpty = tokens.some((name) => !(vars[name] ?? '').toString().trim());
    return anyEmpty ? '' : substitute(inner);
  });

  return tidy(substitute(withOptionalBlocks));
}

/**
 * Adds a full stop when a rendered sentence lost its own to a dropped optional
 * block. Without one the voice engine gives the clip a rising, unfinished
 * intonation, which sounds like a mistake when the applause comes in after it.
 */
function ensureTerminal(text: string, terminator: string): string {
  if (!text) return text;
  return /[.!?।]["”'’)]?$/.test(text) ? text : text + terminator;
}

/**
 * Cleans up the punctuation debris left when optional blocks drop out, so the
 * voice engine never has to read a stray comma or a doubled full stop.
 */
function tidy(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.।;:!?])/g, '$1')
    .replace(/([,.।;:])\1+/g, '$1')
    .replace(/^[\s,.;:—–-]+/, '')
    .replace(/[\s,;:—–-]+$/, '')
    .trim();
}

function templatesFor(event: Event, language: string): TemplateSet | undefined {
  return event.templates[language];
}

/** True when the event has wording for this language, so it can be generated. */
export function hasTemplatesFor(event: Event, language: string): boolean {
  const set = templatesFor(event, language);
  return Boolean(set?.intro?.trim() && set?.awardLine?.trim() && set?.closing?.trim());
}

export class MissingTemplatesError extends Error {
  readonly language: string;

  constructor(language: string) {
    super(
      `This event has no wording set for ${language}. Add it under Event settings before generating certificates in that language.`,
    );
    this.name = 'MissingTemplatesError';
    this.language = language;
  }
}

type CertificateInput = Pick<
  Certificate,
  | 'studentName'
  | 'namePronunciation'
  | 'school'
  | 'city'
  | 'className'
  | 'projectTitle'
  | 'projectBlurb'
  | 'award'
  | 'language'
>;

export function buildScript(event: Event, certificate: CertificateInput): ScriptSnapshot {
  const language = certificate.language || event.defaultLanguage;
  const templates = templatesFor(event, language);
  if (!templates) throw new MissingTemplatesError(language);

  const vars: ScriptVars = {
    event: event.name,
    org: event.orgName,
    date: event.eventDate,
    venue: event.venue,
    name: certificate.studentName,
    school: certificate.school,
    city: certificate.city,
    class: certificate.className,
    projectTitle: certificate.projectTitle,
    blurb: certificate.projectBlurb,
    award: certificate.award,
    // Pre-joined so one template covers school-only, city-only and both. If the
    // two were separate optional blocks, a student with a city but no recorded
    // school would be introduced as "Ravi Kumar Bengaluru".
    location: [certificate.school, certificate.city]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(', '),
  };

  const modelId = resolveModel(event.modelId, language);
  const terminator = terminatorFor(language);
  const segments: ScriptSegment[] = [];

  const push = (
    id: ScriptSegment['id'],
    text: string,
    options: { spoken?: string; speed?: number; shared?: boolean; terminate?: boolean } = {},
  ) => {
    const finalText = options.terminate ? ensureTerminal(text.trim(), terminator) : text.trim();
    if (!finalText) return;
    segments.push({
      id,
      text: finalText,
      spoken: options.spoken?.trim() || finalText,
      speed: options.speed ?? 1,
      shared: options.shared ?? false,
    });
  };

  // Shared beats are identical for every student in the event, so they are
  // synthesised once and reused -- see the tts_cache table.
  push('intro', renderTemplate(templates.intro, vars), { shared: true, terminate: true });
  // No full stop here on purpose: "This certificate is awarded to" should lead
  // into the name with an open, rising intonation rather than landing.
  push('awardLine', renderTemplate(templates.awardLine, vars), { shared: true });

  // The name is its own clip, spoken slowly, and surrounded by silence in the
  // mix. It is the moment the certificate exists for.
  push('name', certificate.studentName.trim(), {
    spoken: certificate.namePronunciation?.trim() || certificate.studentName.trim(),
    speed: modelSupportsSpeed(modelId) ? 0.9 : 1,
  });

  push('citation', renderTemplate(templates.citation, vars), { terminate: true });
  push('prize', renderTemplate(templates.prize, vars), { terminate: true });
  push('closing', renderTemplate(templates.closing, vars), { shared: true, terminate: true });

  return {
    language,
    voiceId: event.voiceId,
    // The resolved model, not the event's possibly-"auto" setting, so the
    // snapshot records exactly what produced this audio.
    modelId,
    segments,
  };
}

/** The certificate as continuous prose, for the on-page transcript. */
export function transcriptFrom(snapshot: ScriptSnapshot): string {
  return snapshot.segments.map((segment) => segment.text).join(' ');
}

/** Characters billed to the voice engine, excluding cached shared beats. */
export function billableChars(snapshot: ScriptSnapshot): number {
  return snapshot.segments
    .filter((segment) => !segment.shared)
    .reduce((total, segment) => total + segment.spoken.length, 0);
}
