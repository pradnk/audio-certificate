import { notFound } from 'next/navigation';

import '@/app/print.css';
import { PrintableCertificate } from '@/components/printable-certificate';
import { PrintWarnings } from '@/components/print-warnings';
import { getCertificateByPublicId } from '@/lib/data';
import { siteUrl } from '@/lib/env';
import { qrDataUrl } from '@/lib/qr';
import { PrintButton } from './print-button';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/c/[publicId]/print'>) {
  const { publicId } = await params;
  const row = await getCertificateByPublicId(publicId);
  return { title: row ? `Print — ${row.certificate.studentName}` : 'Print certificate' };
}

export default async function PrintCertificatePage({
  params,
}: PageProps<'/c/[publicId]/print'>) {
  const { publicId } = await params;
  const row = await getCertificateByPublicId(publicId);
  if (!row) notFound();

  const url = `${siteUrl()}/c/${publicId}`;

  return (
    <main id="main">
      <PrintButton label="Print this certificate" />
      <PrintWarnings
        url={url}
        notReady={row.certificate.status === 'ready' ? [] : [row.certificate.studentName]}
      />
      <PrintableCertificate
        event={row.event}
        certificate={row.certificate}
        url={url}
        qrDataUrl={await qrDataUrl(url)}
      />
    </main>
  );
}
