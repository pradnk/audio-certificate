import type { Certificate, Event } from '@/lib/db/schema';
import { isTop, isLeft } from '@/lib/logo';

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
 * ratio and no decorative script faces.
 *
 * The address is carried by the QR code alone and is not printed as text. It
 * used to be, on the reasoning that someone who cannot scan a code could still
 * type it -- but a deployment URL runs to seventy characters, which is not
 * something anyone types accurately and which dominated the foot of the sheet.
 * The full address is still in the QR image's alt text, so a screen reader
 * reading the print page aloud reaches it.
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
  const logoAtTop = event.logoUrl && isTop(event.logoPosition);
  const logoAtBottom = event.logoUrl && !isTop(event.logoPosition);
  const side = isLeft(event.logoPosition) ? 'start' : 'end';

  /*
   * alt="" on purpose. The organisation's name is printed as text a few
   * millimetres away, so giving the logo a text alternative would make a screen
   * reader announce "Vividha Trust" twice. It is decorative in the precise
   * sense the term means: it conveys nothing the text does not.
   */
  const logo = event.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary Blob URL; next/image cannot participate in a print layout
    <img src={event.logoUrl} alt="" className="certificate-logo" />
  ) : null;

  return (
    <article className="certificate-page">
      <div className="certificate-frame">
        <header className={`certificate-header certificate-band-${side}`}>
          {logoAtTop && logo}
          <div className="certificate-heading">
            <p className="certificate-event">{event.name}</p>
            <p className="certificate-org">
              {event.orgName}
              {event.eventDate ? ` · ${event.eventDate}` : ''}
            </p>
          </div>
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

        <footer className={`certificate-footer certificate-band-${side}`}>
          {logoAtBottom && logo}
          <div className="certificate-listen">
            <p className="certificate-listen-title">This certificate speaks.</p>
            <p className="certificate-listen-body">
              Point a phone camera at the code to hear it read aloud, with the applause it was
              given.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- a data URL that must survive printing */}
          <img src={qrDataUrl} alt={`QR code linking to ${url}`} className="certificate-qr" />
        </footer>

        {/*
          A sibling after the footer rather than a child of it: the footer
          carries `margin-top: auto`, so anything following it lands at the very
          bottom of the sheet without disturbing the three-slot row of logo,
          listen block and QR code.
        */}
        {event.partnerLogos.length > 0 && (
          <section className="certificate-partners">
            <p className="certificate-partners-label">Presented by</p>
            <div className="certificate-partners-row">
              {event.partnerLogos.map((partner) => (
                // eslint-disable-next-line @next/next/no-img-element -- next/image cannot participate in a print layout
                <img
                  key={partner.url}
                  src={partner.url}
                  /*
                   * A real alt, unlike the presenting organisation's logo above.
                   * These names are printed nowhere on the certificate, so an
                   * empty alt would erase every one of these organisations for
                   * a screen reader rather than avoiding a repetition.
                   */
                  alt={partner.name}
                  className="certificate-partner-logo"
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
