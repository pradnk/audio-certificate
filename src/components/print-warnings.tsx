/**
 * Warnings shown above a print preview, never on the printed page.
 *
 * Both of these catch mistakes that are invisible until the certificates are
 * already on paper and handed out, which is far too late.
 */
export function PrintWarnings({
  url,
  notReady,
}: {
  /** The address the QR codes encode. */
  url: string;
  /** Names whose audio has not been generated yet. */
  notReady: string[];
}) {
  const host = safeHost(url);

  // localhost resolves to whatever device is scanning, so the code can never
  // reach this machine. Always fatal.
  const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';

  // A private network address does work -- for a phone on the same wifi, which
  // is how you would sensibly test a QR code before deploying. It just will not
  // work for a family at home, so it is a caution rather than a blocker.
  const isPrivateNetwork =
    !isLoopback &&
    (host.endsWith('.local') ||
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host));

  if (!isLoopback && !isPrivateNetwork && notReady.length === 0) return null;

  return (
    <div className="print-hide mx-auto flex max-w-4xl flex-col gap-4 px-5 pb-6">
      {isLoopback && (
        <div
          role="alert"
          className="rounded-lg border-2 border-danger bg-danger-bg px-5 py-4 text-danger"
        >
          <p className="text-lg font-bold">Do not print — the QR codes cannot work.</p>
          <p className="mt-2">
            They point at <code className="font-mono font-bold">{url}</code>. A phone scanning that
            code looks for the address <em>on the phone itself</em>, so it will never find the
            certificate.
          </p>
          <p className="mt-2">
            Deploy the site and set{' '}
            <code className="font-mono font-bold">NEXT_PUBLIC_SITE_URL</code> to its public address,
            then reload this page. To test from a phone before deploying, set it to this computer&apos;s
            network address instead — something like{' '}
            <code className="font-mono font-bold">http://192.168.1.20:3000</code> — and keep the
            phone on the same wifi.
          </p>
        </div>
      )}

      {isPrivateNetwork && (
        <div className="rounded-lg border-2 border-focus bg-teal-50 px-5 py-4">
          <p className="text-lg font-bold">These QR codes only work on this wifi network.</p>
          <p className="mt-2">
            They point at <code className="font-mono font-bold">{url}</code>, which is fine for
            testing with a phone on the same network, but a family opening it at home will get
            nothing. Deploy and set{' '}
            <code className="font-mono font-bold">NEXT_PUBLIC_SITE_URL</code> before printing the
            real certificates.
          </p>
        </div>
      )}

      {notReady.length > 0 && (
        <div className="rounded-lg border-2 border-focus bg-teal-50 px-5 py-4">
          <p className="text-lg font-bold">
            {notReady.length} certificate{notReady.length === 1 ? ' has' : 's have'} no audio yet.
          </p>
          <p className="mt-2">
            Scanning {notReady.length === 1 ? 'its' : 'their'} QR code will reach the page, but there
            will be nothing to listen to. Make the audio first, on the students page.
          </p>
          <p className="mt-2 font-bold">{notReady.join(', ')}</p>
        </div>
      )}
    </div>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
