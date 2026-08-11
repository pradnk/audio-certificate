import { notFound } from 'next/navigation';

import '@/app/print.css';
import { PrintButton } from '@/app/c/[publicId]/print/print-button';
import { PrintableCertificate } from '@/components/printable-certificate';
import { PrintWarnings } from '@/components/print-warnings';
import { getEvent, listCertificates } from '@/lib/data';
import { siteUrl } from '@/lib/env';
import { qrDataUrl } from '@/lib/qr';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/admin/events/[id]/print'>) {
  const { id } = await params;
  const event = await getEvent(id);
  return { title: event ? `Print all — ${event.name}` : 'Print certificates' };
}

/**
 * Every certificate for an event, one per page.
 *
 * Printing the whole event in a single pass produces one PDF the school can
 * file or send to a print shop, which is what an organiser actually wants --
 * rather than forty-five separate downloads to collate by hand.
 */
export default async function PrintAllPage({ params }: PageProps<'/admin/events/[id]/print'>) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const rows = await listCertificates(id);
  const origin = siteUrl();

  const pages = await Promise.all(
    rows.map(async (certificate) => {
      const url = `${origin}/c/${certificate.publicId}`;
      return { certificate, url, qr: await qrDataUrl(url) };
    }),
  );

  return (
    <main id="main">
      <PrintButton
        label={`Print all ${pages.length} certificates`}
        hint={`${pages.length} certificate${pages.length === 1 ? '' : 's'}, one per page.`}
      />
      <PrintWarnings
        url={origin}
        notReady={rows.filter((row) => row.status !== 'ready').map((row) => row.studentName)}
      />

      {pages.length === 0 && (
        <p className="print-hide mx-auto max-w-4xl px-5">
          There are no students in this event yet.
        </p>
      )}

      {pages.map(({ certificate, url, qr }) => (
        <PrintableCertificate
          key={certificate.id}
          event={event}
          certificate={certificate}
          url={url}
          qrDataUrl={qr}
        />
      ))}
    </main>
  );
}
