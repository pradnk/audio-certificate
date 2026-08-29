'use server';

import { eq, inArray, max } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/lib/auth-server';
import {
  DEFAULT_CERTIFICATE_LAYOUT,
  DEFAULT_PARTNER_LOGO_POSITION,
  isCertificateLayout,
  isPartnerLogoPosition,
  normalisePartnerLabel,
  type CertificateLayout,
  type PartnerLogoPosition,
} from '@/lib/certificate-layout';
import { mostRecentEvent, newEventDefaults, newPublicId, pickDefaultVoice } from '@/lib/data';
import { listVoices } from '@/lib/elevenlabs';
import { db } from '@/lib/db';
import { certificates, events, type ScriptSnapshot } from '@/lib/db/schema';
import { DEFAULT_LOGO_POSITION, isLogoPosition, type LogoPosition } from '@/lib/logo';
import { normalisePartnerLogos, type PartnerLogo } from '@/lib/partners';
import { normalisePrintWording, type PrintWording } from '@/lib/print-wording';
import { normaliseRecipientTypes, type RecipientType } from '@/lib/recipient-types';
import { buildScript, MissingTemplatesError } from '@/lib/script';

async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error('Your session has expired. Please sign in again.');
  }
}

/**
 * Refuses changes to an event that has been marked complete.
 *
 * Enforced on the server, not just by disabling buttons: the point of archiving
 * is that a finished event cannot be altered by accident months later, and a
 * stale browser tab left open from the day of the ceremony is exactly how that
 * would otherwise happen.
 */
async function assertNotArchived(eventId: string): Promise<void> {
  const [row] = await db()
    .select({ archivedAt: events.archivedAt, name: events.name })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (row?.archivedAt) {
    throw new Error(
      `${row.name} is marked complete, so it cannot be changed. Reopen it in Event settings first.`,
    );
  }
}

/** Same check, starting from a certificate rather than its event. */
async function assertCertificateEditable(certificateId: string): Promise<void> {
  const [row] = await db()
    .select({ archivedAt: events.archivedAt, name: events.name })
    .from(certificates)
    .innerJoin(events, eq(certificates.eventId, events.id))
    .where(eq(certificates.id, certificateId))
    .limit(1);

  if (row?.archivedAt) {
    throw new Error(
      `${row.name} is marked complete, so it cannot be changed. Reopen it in Event settings first.`,
    );
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// ------------------------------------------------------------------- events

export async function createEvent(formData: FormData): Promise<void> {
  await assertAdmin();

  const name = String(formData.get('name') ?? '').trim();
  if (!name) throw new Error('The event needs a name.');

  const orgName = String(formData.get('orgName') ?? '').trim();
  if (!orgName) {
    throw new Error('The event needs an organisation name — it is spoken on every certificate.');
  }

  // The logo is uploaded before the event exists, so the form carries its URL.
  const logoUrl = String(formData.get('logoUrl') ?? '').trim() || null;
  const rawPosition = String(formData.get('logoPosition') ?? '');
  const logoPosition = isLogoPosition(rawPosition) ? rawPosition : DEFAULT_LOGO_POSITION;

  // Carry forward the previous event's wording, award categories, partner
  // logos, voice and language. Running the same ceremony each year is the normal case, and
  // retyping all of it is not.
  const previous = await mostRecentEvent();

  // Only guess at a voice for the very first event. After that, whatever was
  // chosen last time has already been listened to and approved.
  let voiceId = previous?.voiceId;
  if (!voiceId) {
    // If the voice service is unreachable the event is still created -- the
    // settings page is where you would go to fix that, and it should not be
    // behind a working API key.
    try {
      voiceId = pickDefaultVoice(await listVoices());
    } catch {
      voiceId = pickDefaultVoice([]);
    }
  }

  const [created] = await db()
    .insert(events)
    .values({
      ...newEventDefaults(
        name,
        `${slugify(name)}-${newPublicId().slice(0, 4)}`,
        voiceId,
        previous,
        orgName,
      ),
      logoUrl,
      logoPosition,
    })
    .returning();

  redirect(`/admin/events/${created.id}/students`);
}

export type EventSettings = {
  name: string;
  orgName: string;
  eventDate: string | null;
  venue: string | null;
  voiceId: string;
  modelId: string;
  defaultLanguage: string;
  logoUrl: string | null;
  logoPosition: LogoPosition;
  templates: Record<string, { intro: string; awardLine: string; citation: string; prize: string; closing: string }>;
  /** The groups this event honours, each with its prizes. See lib/recipient-types.ts. */
  recipientTypes: RecipientType[];
  /** Co-organisers and supporters shown at the foot. See lib/partners.ts. */
  partnerLogos: PartnerLogo[];
  partnerLogoPosition: PartnerLogoPosition;
  /** Written above the partner logos; empty means no label. */
  partnerLabel: string;
  /** Which printed arrangement to use. See lib/certificate-layout.ts. */
  certificateLayout: CertificateLayout;
  /** The words on the printed sheet, as opposed to the spoken templates. */
  printWording: PrintWording;
};

export async function updateEvent(eventId: string, settings: EventSettings): Promise<void> {
  await assertAdmin();
  await assertNotArchived(eventId);

  await db()
    .update(events)
    .set({
      ...settings,
      logoPosition: isLogoPosition(settings.logoPosition)
        ? settings.logoPosition
        : DEFAULT_LOGO_POSITION,
      // Trimmed and de-duplicated here rather than trusting the form: an action
      // is a public POST endpoint, and these labels are printed and spoken. A
      // caller that sends no list at all -- a browser tab left open from before
      // recipient types existed -- leaves the stored one alone rather than
      // silently clearing it.
      recipientTypes: Array.isArray(settings.recipientTypes)
        ? normaliseRecipientTypes(settings.recipientTypes)
        : undefined,
      // Same treatment, and the same reason, as the awards list above.
      partnerLogos: Array.isArray(settings.partnerLogos)
        ? normalisePartnerLogos(settings.partnerLogos)
        : undefined,
      // The two enums get the same guard-and-fall-back treatment as
      // logoPosition above, so a stale or hand-made payload cannot store a
      // value the renderer has no branch for.
      partnerLogoPosition: isPartnerLogoPosition(settings.partnerLogoPosition)
        ? settings.partnerLogoPosition
        : DEFAULT_PARTNER_LOGO_POSITION,
      partnerLabel: normalisePartnerLabel(settings.partnerLabel),
      certificateLayout: isCertificateLayout(settings.certificateLayout)
        ? settings.certificateLayout
        : DEFAULT_CERTIFICATE_LAYOUT,
      printWording: normalisePrintWording(settings.printWording),
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));

  revalidateEverywhere(eventId);
}

/**
 * Marks an event complete, or reopens it.
 *
 * Archiving is purely an admin-side lock. Certificate pages stay public and
 * playable: a family who was handed a link in 2026 should still be able to open
 * it in 2036, long after anyone has stopped thinking about the event.
 */
export async function setEventArchived(eventId: string, archived: boolean): Promise<void> {
  await assertAdmin();

  await db()
    .update(events)
    .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(eq(events.id, eventId));

  revalidateEverywhere(eventId);
}

/**
 * Certificate pages embed the logo and the event's name, so a settings change
 * has to invalidate them too, not just the admin screens.
 */
function revalidateEverywhere(eventId: string): void {
  revalidatePath('/admin');
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/students`);
  revalidatePath(`/admin/events/${eventId}/print`);
  revalidatePath('/c/[publicId]', 'page');
  revalidatePath('/c/[publicId]/print', 'page');
}

// ------------------------------------------------------------- certificates

export type CertificateInput = {
  studentName: string;
  namePronunciation?: string | null;
  school?: string | null;
  city?: string | null;
  className?: string | null;
  projectTitle?: string | null;
  projectBlurb?: string | null;
  award: string;
  /** Which recipient type this is, by id. Empty means the event's first. */
  recipientType?: string;
  language: string;
};

function clean(input: CertificateInput) {
  const trim = (value: string | null | undefined) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  };
  return {
    studentName: input.studentName.trim(),
    namePronunciation: trim(input.namePronunciation),
    school: trim(input.school),
    city: trim(input.city),
    className: trim(input.className),
    projectTitle: trim(input.projectTitle),
    projectBlurb: trim(input.projectBlurb),
    award: input.award.trim(),
    recipientType: (input.recipientType ?? '').trim(),
    language: input.language,
  };
}

export async function addCertificates(
  eventId: string,
  inputs: CertificateInput[],
): Promise<{ added: number }> {
  await assertAdmin();
  await assertNotArchived(eventId);

  const cleaned = inputs.map(clean).filter((row) => row.studentName && row.award);
  if (cleaned.length === 0) return { added: 0 };

  // Append after whatever is already there, so an imported list keeps the order
  // it had in the spreadsheet and later imports land underneath it.
  const [{ highest } = { highest: null }] = await db()
    .select({ highest: max(certificates.sortIndex) })
    .from(certificates)
    .where(eq(certificates.eventId, eventId));

  const start = (highest ?? -1) + 1;
  const rows = cleaned.map((row, index) => ({
    ...row,
    eventId,
    publicId: newPublicId(),
    sortIndex: start + index,
  }));

  await db().insert(certificates).values(rows);
  revalidatePath(`/admin/events/${eventId}/students`);
  return { added: rows.length };
}

export async function updateCertificate(
  certificateId: string,
  input: CertificateInput,
): Promise<void> {
  await assertAdmin();
  await assertCertificateEditable(certificateId);

  const [row] = await db()
    .update(certificates)
    .set({
      ...clean(input),
      // Any edit invalidates the audio: the recording no longer matches the
      // details. Better to force a regenerate than to hand someone a
      // certificate whose text and voice disagree.
      status: 'draft',
      reviewed: false,
      errorMessage: null,
    })
    .where(eq(certificates.id, certificateId))
    .returning({ eventId: certificates.eventId });

  if (row) revalidatePath(`/admin/events/${row.eventId}/students`);
}

/**
 * Changes the same field on several certificates at once.
 *
 * A whole group is usually wrong together -- a column read as the wrong prize,
 * a school's worth of recipients entered under Student when they are teachers,
 * a batch that should have been in Kannada. Fixing those one row at a time is
 * where somebody gives up and settles for a certificate that is not quite
 * right.
 *
 * Only the fields sent are touched, so a caller changing the prize cannot
 * blank the language by omitting it.
 */
export async function updateCertificatesBulk(
  certificateIds: string[],
  changes: { award?: string; recipientType?: string; language?: string },
): Promise<{ updated: number }> {
  await assertAdmin();

  const ids = [...new Set(certificateIds)].filter(Boolean);
  if (ids.length === 0) return { updated: 0 };

  const award = changes.award?.trim();
  const recipientType = changes.recipientType?.trim();
  const language = changes.language?.trim();
  if (!award && !recipientType && !language) return { updated: 0 };

  // Every row is checked, not just the first: a selection can span events, and
  // a completed one must stay locked however the request arrived.
  for (const id of ids) await assertCertificateEditable(id);

  const rows = await db()
    .update(certificates)
    .set({
      ...(award ? { award } : {}),
      ...(recipientType ? { recipientType } : {}),
      ...(language ? { language } : {}),
      // The same reasoning as a single edit: the recording no longer matches
      // the details, so it has to be made again rather than handed over saying
      // one thing while the page says another.
      status: 'draft',
      reviewed: false,
      errorMessage: null,
    })
    .where(inArray(certificates.id, ids))
    .returning({ eventId: certificates.eventId });

  const eventId = rows[0]?.eventId;
  if (eventId) revalidatePath(`/admin/events/${eventId}/students`);
  return { updated: rows.length };
}

export async function deleteCertificate(certificateId: string): Promise<void> {
  await assertAdmin();
  await assertCertificateEditable(certificateId);

  const [row] = await db()
    .delete(certificates)
    .where(eq(certificates.id, certificateId))
    .returning({ eventId: certificates.eventId });

  if (row) revalidatePath(`/admin/events/${row.eventId}/students`);
}

export async function setReviewed(certificateId: string, reviewed: boolean): Promise<void> {
  await assertAdmin();
  await db().update(certificates).set({ reviewed }).where(eq(certificates.id, certificateId));
}

// -------------------------------------------------------------- generation

/**
 * Works out exactly what this certificate will say and records it, before any
 * audio is made.
 *
 * The script is built on the server rather than in the browser so that the
 * stored snapshot -- which the public transcript is rendered from -- is
 * authoritative. A tab with stale event settings cannot produce a certificate
 * whose transcript disagrees with its audio.
 */
export async function prepareGeneration(certificateId: string): Promise<ScriptSnapshot> {
  await assertAdmin();
  await assertCertificateEditable(certificateId);

  const [row] = await db()
    .select({ certificate: certificates, event: events })
    .from(certificates)
    .innerJoin(events, eq(certificates.eventId, events.id))
    .where(eq(certificates.id, certificateId))
    .limit(1);

  if (!row) throw new Error('That certificate no longer exists.');

  let snapshot: ScriptSnapshot;
  try {
    snapshot = buildScript(row.event, row.certificate);
  } catch (error) {
    if (error instanceof MissingTemplatesError) throw new Error(error.message);
    throw error;
  }

  await db()
    .update(certificates)
    .set({ scriptSnapshot: snapshot, status: 'generating', errorMessage: null })
    .where(eq(certificates.id, certificateId));

  return snapshot;
}

export async function completeGeneration(
  certificateId: string,
  result: { audioUrl: string; durationMs: number },
): Promise<void> {
  await assertAdmin();

  const [row] = await db()
    .update(certificates)
    .set({
      audioUrl: result.audioUrl,
      audioDurationMs: result.durationMs,
      status: 'ready',
      errorMessage: null,
      generatedAt: new Date(),
      // A freshly generated certificate has not been listened to yet.
      reviewed: false,
    })
    .where(eq(certificates.id, certificateId))
    .returning({ eventId: certificates.eventId, publicId: certificates.publicId });

  if (row) {
    revalidatePath(`/admin/events/${row.eventId}/students`);
    revalidatePath(`/c/${row.publicId}`);
  }
}

export async function failGeneration(certificateId: string, message: string): Promise<void> {
  await assertAdmin();

  const [row] = await db()
    .update(certificates)
    .set({ status: 'failed', errorMessage: message.slice(0, 500) })
    .where(eq(certificates.id, certificateId))
    .returning({ eventId: certificates.eventId });

  if (row) revalidatePath(`/admin/events/${row.eventId}/students`);
}
