'use server';

import { eq, max } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/lib/auth-server';
import { newEventDefaults, newPublicId, pickDefaultVoice } from '@/lib/data';
import { listVoices } from '@/lib/elevenlabs';
import { db } from '@/lib/db';
import { certificates, events, type ScriptSnapshot } from '@/lib/db/schema';
import { buildScript, MissingTemplatesError } from '@/lib/script';

async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error('Your session has expired. Please sign in again.');
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

  // Resolve a voice the account actually has. If the voice service is
  // unreachable the event is still created -- the settings page is where you
  // would go to fix that, and it should not be behind a working API key.
  let voiceId: string;
  try {
    voiceId = pickDefaultVoice(await listVoices());
  } catch {
    voiceId = pickDefaultVoice([]);
  }

  const [created] = await db()
    .insert(events)
    .values(newEventDefaults(name, `${slugify(name)}-${newPublicId().slice(0, 4)}`, voiceId))
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
  templates: Record<string, { intro: string; awardLine: string; citation: string; prize: string; closing: string }>;
};

export async function updateEvent(eventId: string, settings: EventSettings): Promise<void> {
  await assertAdmin();

  await db()
    .update(events)
    .set({ ...settings, updatedAt: new Date() })
    .where(eq(events.id, eventId));

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/admin/events/${eventId}/students`);
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
    language: input.language,
  };
}

export async function addCertificates(
  eventId: string,
  inputs: CertificateInput[],
): Promise<{ added: number }> {
  await assertAdmin();

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

export async function deleteCertificate(certificateId: string): Promise<void> {
  await assertAdmin();

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
