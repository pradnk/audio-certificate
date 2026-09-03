'use client';

import { useState } from 'react';
import JSZip from 'jszip';

import { Alert, Button } from '@/components/ui';
import { certificatePdf } from '@/lib/certificate-file';
import { resolveFileBases } from '@/lib/filename';

export type DownloadItem = {
  /** Shown in messages, so somebody knows which one failed. */
  name: string;
  /**
   * Names the file and, in a bulk download, the folder. Carries the school in a
   * bulk download, which is what makes it both unique and recognisable.
   */
  fileBase: string;
  audioUrl: string | null;
};

/**
 * Saves the certificates on this page as files somebody can be sent.
 *
 * It works from the sheets already rendered on the page rather than building
 * them again, which is what keeps a downloaded certificate identical to the
 * printed one -- the same auto-fit, the same squeeze, the same fonts. The
 * elements are matched to recipients by position, because they were rendered
 * from the same list in the same order.
 *
 * Never printed: this whole block is `print-hide`.
 */
export function CertificateDownloads({
  items,
  zipName,
}: {
  items: DownloadItem[];
  /** Base name for a bulk download; absent means offer only the single file. */
  zipName?: string;
}) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const sheets = () => [...document.querySelectorAll<HTMLElement>('.certificate-page')];

  const save = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const audioFor = async (item: DownloadItem): Promise<ArrayBuffer | null> => {
    if (!item.audioUrl) return null;
    const response = await fetch(item.audioUrl);
    if (!response.ok) throw new Error(`Could not fetch ${item.name}'s audio.`);
    return response.arrayBuffer();
  };

  const run = async (label: string, work: () => Promise<void>) => {
    setError('');
    setBusy(label);
    try {
      await work();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not build the file.');
    } finally {
      setBusy('');
    }
  };

  const one = (withAudio: boolean) =>
    run(withAudio ? 'both' : 'pdf', async () => {
      const page = sheets()[0];
      const item = items[0];
      if (!page || !item) throw new Error('There is no certificate on this page to save.');

      const pdf = await certificatePdf(page);
      if (!withAudio) return save(pdf, `${item.fileBase}.pdf`);

      const audio = await audioFor(item);
      if (!audio) throw new Error('That certificate has no recording yet — make it first.');

      const zip = new JSZip();
      zip.file(`${item.fileBase}.pdf`, pdf);
      zip.file(`${item.fileBase}.mp3`, audio);
      save(await zip.generateAsync({ type: 'blob' }), `${item.fileBase}.zip`);
    });

  const all = () =>
    run('all', async () => {
      const pages = sheets();
      const zip = new JSZip();
      const { bases } = resolveFileBases(items);
      let missingAudio = 0;

      // One at a time: each capture holds a full-page bitmap, and doing forty
      // at once is how a browser tab runs out of memory mid-download.
      for (const [index, item] of items.entries()) {
        const page = pages[index];
        if (!page) continue;
        setBusy(`all:${index + 1}`);

        // A folder per recipient, so the whole thing can be forwarded as it is.
        const name = bases[index];
        const folder = zip.folder(name) ?? zip;
        folder.file(`${name}.pdf`, await certificatePdf(page));

        const audio = await audioFor(item);
        if (audio) folder.file(`${name}.mp3`, audio);
        else missingAudio += 1;
      }

      save(await zip.generateAsync({ type: 'blob' }), `${zipName}.zip`);
      if (missingAudio > 0) {
        setError(
          `${missingAudio} certificate${missingAudio === 1 ? ' has' : 's have'} no recording yet, ` +
            'so their folder holds only the PDF. Make the audio and download again.',
        );
      }
    });

  const working = busy !== '';
  const progress = busy.startsWith('all:') ? ` ${busy.slice(4)} of ${items.length}` : '';

  /*
   * Shown before anything is clicked, not after: the fix is a correction to the
   * data on the recipients page, and it is worth making before spending several
   * minutes building a ZIP that will need building again.
   */
  const clashes = zipName ? resolveFileBases(items).clashes : [];

  return (
    <div className="print-hide mx-auto flex max-w-4xl flex-col gap-3 px-5 pb-6">
      <div className="flex flex-wrap items-center gap-3">
        {zipName ? (
          <Button onClick={all} disabled={working || items.length === 0}>
            {busy.startsWith('all')
              ? `Building…${progress}`
              : `Download ${items.length} as files`}
          </Button>
        ) : (
          <>
            <Button onClick={() => one(false)} disabled={working}>
              {busy === 'pdf' ? 'Building…' : 'Download as PDF'}
            </Button>
            <Button variant="secondary" onClick={() => one(true)} disabled={working}>
              {busy === 'both' ? 'Building…' : 'Download PDF and audio'}
            </Button>
          </>
        )}
        <span className="text-ink-soft">
          {zipName
            ? 'A folder for each person, holding their certificate and their recording. A large event runs to a few hundred megabytes, so give it a minute.'
            : 'A picture of this certificate, the size of an A4 sheet.'}
        </span>
      </div>
      {clashes.length > 0 && (
        <Alert>
          {clashes.length === 1 ? 'Two people share' : `${clashes.length} sets of people share`} a
          name and a school, so their folders cannot be told apart:{' '}
          {clashes.map((clash) => `${clash.names[0]} (×${clash.names.length})`).join(', ')}. They
          are numbered for now, so nobody&rsquo;s certificate is lost — but check the recipients
          list, because this is usually the same person entered twice.
        </Alert>
      )}
      {working && (
        <p aria-live="polite" className="font-bold">
          Keep this tab open while the files are built.
        </p>
      )}
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
