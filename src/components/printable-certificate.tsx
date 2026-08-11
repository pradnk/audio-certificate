import type { Certificate, Event } from '@/lib/db/schema';

/**
 * The paper version of a certificate.
 *
 * Rendered as HTML for the browser's own print-to-PDF rather than generated
 * server-side with a PDF library. That is a deliberate trade: a PDF toolkit
 * needs every script's font registered up front, and a student whose name is
 * written in Kannada or Tamil would otherwise come out as a row of empty boxes.
 * The browser already has those fonts and shapes them correctly, so printing
 * from the page is both simpler and more correct for this audience.
 *
 * The layout is also built for low vision: very large type, a 7:1 contrast
 * ratio, no decorative script faces, and the listen-to-it link spelled out in
 * full as well as encoded in the QR code.
 */
export function PrintableCertificate({
  event,
  certificate,
  url,
  qrDataUrl,
}: {
  event: Event;
  certificate: Certificate;
  url: string;
  qrDataUrl: string;
}) {
  const details = [certificate.school, certificate.city].filter(Boolean).join(', ');

  return (
    <article className="certificate-page">
      <div className="certificate-frame">
        <header className="certificate-header">
          <p className="certificate-event">{event.name}</p>
          <p className="certificate-org">
            {event.orgName}
            {event.eventDate ? ` · ${event.eventDate}` : ''}
          </p>
        </header>

        <p className="certificate-lead">This certificate is awarded to</p>
        <h1 className="certificate-name">{certificate.studentName}</h1>

        {details && <p className="certificate-detail">{details}</p>}

        <p className="certificate-award">{certificate.award}</p>

        {certificate.projectTitle && (
          <p className="certificate-project">
            for their exhibit, “{certificate.projectTitle}”
            {certificate.projectBlurb ? ` — ${certificate.projectBlurb}` : ''}
          </p>
        )}

        <footer className="certificate-footer">
          <div className="certificate-listen">
            <p className="certificate-listen-title">This certificate speaks.</p>
            <p className="certificate-listen-body">
              Scan the code, or visit the address below, to hear it read aloud with the applause it
              was given.
            </p>
            <p className="certificate-url">{url}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- a data URL that must survive printing */}
          <img src={qrDataUrl} alt={`QR code linking to ${url}`} className="certificate-qr" />
        </footer>
      </div>
    </article>
  );
}
