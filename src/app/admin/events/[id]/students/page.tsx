import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getEvent, listCertificates } from '@/lib/data';
import { siteUrl } from '@/lib/env';
import { StudentsClient } from './students-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/admin/events/[id]/students'>) {
  const { id } = await params;
  const event = await getEvent(id);
  return { title: event ? `Students — ${event.name}` : 'Students' };
}

export default async function StudentsPage({ params }: PageProps<'/admin/events/[id]/students'>) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const rows = await listCertificates(id);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-ink-soft">{event.orgName}</p>
        </div>
        <div className="flex flex-wrap gap-5">
          <Link
            href={`/admin/events/${event.id}/print`}
            className="font-bold text-teal-900 underline underline-offset-4"
          >
            Print all certificates
          </Link>
          <Link
            href={`/admin/events/${event.id}`}
            className="font-bold text-teal-900 underline underline-offset-4"
          >
            Event settings — voice and wording
          </Link>
        </div>
      </div>

      <StudentsClient event={event} initialRows={rows} siteUrl={siteUrl()} />
    </main>
  );
}
