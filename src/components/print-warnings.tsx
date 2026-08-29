'use client';

import { useEffect, useState } from 'react';

import { isDeploymentSpecificHost } from '@/lib/env';

/**
 * Warnings shown above a print preview, never on the printed page.
 *
 * All of these catch mistakes that are invisible until the certificates are
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
  const overflowing = useOverflowingCertificates();
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

  // A Vercel address containing a build hash or a branch name belongs to one
  // deployment, not to the project. It works when you test it and 404s the next
  // time anyone deploys -- by which point the codes are printed and handed out.
  const isPerDeployment = !isLoopback && !isPrivateNetwork && isDeploymentSpecificHost(host);

  if (
    !isLoopback &&
    !isPrivateNetwork &&
    !isPerDeployment &&
    notReady.length === 0 &&
    overflowing.length === 0
  ) {
    return null;
  }

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

      {isPerDeployment && (
        <div
          role="alert"
          className="rounded-lg border-2 border-danger bg-danger-bg px-5 py-4 text-danger"
        >
          <p className="text-lg font-bold">Do not print — these QR codes will stop working.</p>
          <p className="mt-2">
            They point at <code className="font-mono font-bold">{host}</code>, which is the address
            of <em>one deployment</em> rather than of the site. The next time anyone deploys, that
            address disappears and every code printed today leads nowhere.
          </p>
          <p className="mt-2">
            Set <code className="font-mono font-bold">NEXT_PUBLIC_SITE_URL</code> to the project&apos;s
            permanent address — its custom domain, or the Vercel address without the
            deployment&apos;s own hash in it — then redeploy and reload this page.
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

      {overflowing.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border-2 border-danger bg-danger-bg px-5 py-4 text-danger"
        >
          <p className="text-lg font-bold">
            {overflowing.length} certificate{overflowing.length === 1 ? '' : 's'} will not fit on
            one sheet.
          </p>
          <p className="mt-2">
            The content runs past the border and will spill onto a second page. Usually it is a very
            long name, or a description of several lines — shorten the description on the students
            page, and the rest will fall back into place.
          </p>
          <p className="mt-2 font-bold">{overflowing.join(', ')}</p>
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

/**
 * Names of the certificates whose content runs past the printed frame.
 *
 * The sheet is a fixed 297x210mm with no overflow guard, so a name that wraps
 * to two lines or a long description silently produces a second, mostly-empty
 * page -- and nobody finds out until forty of them are on the printer. Measured
 * rather than estimated because the only honest answer comes from the browser
 * that is about to do the printing.
 */
function useOverflowingCertificates(): string[] {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const spilling = [...document.querySelectorAll('.certificate-page')]
        .filter((page) => {
          const frame = page.querySelector('.certificate-frame');
          // A pixel of tolerance: sub-pixel rounding of millimetre units
          // otherwise reports a perfectly fine sheet as overflowing.
          return frame ? frame.scrollHeight > frame.clientHeight + 1 : false;
        })
        .map(
          (page) =>
            page.querySelector('.certificate-name')?.textContent?.trim() || 'Unnamed certificate',
        );
      setNames(spilling);
    };

    // Fonts and logos both change the height, and both land after first paint,
    // so measuring on mount alone would clear the warning it should raise.
    const images = [...document.querySelectorAll<HTMLImageElement>('.certificate-page img')];
    void Promise.all([
      document.fonts?.ready,
      ...images.map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            }),
      ),
    ]).then(measure);

    window.addEventListener('resize', measure);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', measure);
    };
  }, []);

  return names;
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
