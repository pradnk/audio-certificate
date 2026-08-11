import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getCertificateByPublicId } from '@/lib/data';
import type { ScriptSnapshot } from '@/lib/db/schema';
import { certificateFileBase } from '@/lib/filename';
import { CertificatePlayer } from './player';

export async function generateMetadata({ params }: PageProps<'/c/[publicId]'>): Promise<Metadata> {
  const { publicId } = await params;
  const row = await getCertificateByPublicId(publicId);
  if (!row) return { title: 'Certificate not found' };

  const title = `${row.certificate.studentName} — ${row.certificate.award}`;
  return {
    title,
    description: `${row.certificate.award} at ${row.event.name}, presented by ${row.event.orgName}. Listen to this certificate.`,
    openGraph: {
      title,
      description: `${row.certificate.award} at ${row.event.name}`,
      type: 'website',
    },
  };
}

/**
 * A single certificate, as heard and as read.
 *
 * The transcript below the player is rendered from the stored script snapshot,
 * so it is word-for-word what the audio says. That matters more than it looks:
 * it means the page is complete for someone whose screen reader is their
 * primary way through it, for someone who cannot play audio right now, and for
 * a search engine or a link preview.
 */
export default async function CertificatePage({ params }: PageProps<'/c/[publicId]'>) {
  const { publicId } = await params;
  const row = await getCertificateByPublicId(publicId);
  if (!row) notFound();

  const { certificate, event } = row;
  const snapshot = certificate.scriptSnapshot as ScriptSnapshot | null;
  const audioUrl = certificate.status === 'ready' ? certificate.audioUrl : null;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:py-16">
      <article>
        <header className="mb-8 border-b-4 border-teal-800 pb-6">
          <p className="text-lg font-bold tracking-wide text-teal-800 uppercase">{event.name}</p>
          <p className="text-ink-soft">
            {event.orgName}
            {event.eventDate && ` · ${event.eventDate}`}
          </p>
        </header>

        <p className="text-xl text-ink-soft">This certificate is awarded to</p>
        <h1 className="mt-1 mb-4 text-5xl leading-tight font-bold text-balance sm:text-6xl">
          {certificate.studentName}
        </h1>

        <p className="mb-8 inline-block rounded-lg bg-teal-100 px-4 py-2 text-2xl font-bold text-teal-900">
          {certificate.award}
        </p>

        {audioUrl ? (
          <CertificatePlayer
            audioUrl={audioUrl}
            studentName={certificate.studentName}
            downloadName={`${certificateFileBase(event.name, certificate.studentName)}.mp3`}
          />
        ) : (
          <p className="rounded-lg border-2 border-line bg-paper-sunk px-4 py-5 text-lg">
            The audio for this certificate is not ready yet. The written version is below, and the
            recording will appear here once it has been made.
          </p>
        )}

        {/* A verbatim transcript. It repeats the name and award shown above,
            which is the point: this is exactly what the recording says, so the
            page is complete for anyone who cannot or would rather not play it.
            The heading makes the repetition read as deliberate. */}
        <section
          aria-labelledby="citation-heading"
          className="mt-12 rounded-xl border-2 border-line bg-paper-sunk p-6"
        >
          <h2 id="citation-heading" className="mb-4 text-2xl font-bold">
            Word for word, what you will hear
          </h2>

          {snapshot ? (
            <div className="flex flex-col gap-3 text-xl leading-relaxed">
              {snapshot.segments.map((segment, index) => (
                <p key={`${segment.id}-${index}`}>
                  {segment.id === 'name' ? (
                    <strong className="text-2xl">{segment.text}</strong>
                  ) : (
                    segment.text
                  )}
                </p>
              ))}
            </div>
          ) : (
            // Falls back to the stored details when a certificate has been
            // entered but not yet generated, so the page is never empty.
            <div className="flex flex-col gap-3 text-xl leading-relaxed">
              <p>
                {certificate.studentName}
                {certificate.school && `, from ${certificate.school}`}
                {certificate.city && `, ${certificate.city}`}.
              </p>
              {certificate.projectTitle && <p>Exhibit: {certificate.projectTitle}</p>}
              {certificate.projectBlurb && <p>{certificate.projectBlurb}</p>}
              <p>{certificate.award}</p>
            </div>
          )}
        </section>

        <p className="mt-8">
          <Link
            href={`/c/${publicId}/print`}
            className="inline-flex min-h-14 items-center rounded-lg border-2 border-line px-5 text-lg font-bold text-teal-900 hover:bg-teal-50"
          >
            Print this certificate
          </Link>
        </p>

        <footer className="mt-14 border-t-2 border-line pt-6 text-ink-soft">
          <p>
            Presented by {event.orgName}
            {event.venue && ` at ${event.venue}`}.
          </p>
          <p className="mt-2">
            <a
              href="https://vividhatrust.org"
              className="font-bold text-teal-900 underline underline-offset-4"
            >
              vividhatrust.org
            </a>
          </p>
        </footer>
      </article>
    </main>
  );
}
