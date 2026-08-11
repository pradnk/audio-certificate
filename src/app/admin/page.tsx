import Link from 'next/link';
import type { Metadata } from 'next';

import { Button, Card, Field, Input } from '@/components/ui';
import { listEvents } from '@/lib/data';
import { createEvent } from './actions';

export const metadata: Metadata = { title: 'Events' };
export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  const events = await listEvents();

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
      <h1 className="mb-8 text-3xl font-bold">Events</h1>

      {events.length > 0 && (
        <ul className="mb-10 flex flex-col gap-3">
          {events.map((event) => (
            <li key={event.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{event.name}</h2>
                  <p className="text-ink-soft">{event.orgName}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="inline-flex min-h-11 items-center rounded-lg border-2 border-teal-800 px-4 font-bold text-teal-900 hover:bg-teal-50"
                  >
                    Settings
                  </Link>
                  <Link
                    href={`/admin/events/${event.id}/students`}
                    className="inline-flex min-h-11 items-center rounded-lg bg-teal-800 px-4 font-bold text-white hover:bg-teal-900"
                  >
                    Students
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <h2 className="mb-4 text-xl font-bold">Start a new event</h2>
        <form action={createEvent} className="flex flex-col gap-4">
          <Field
            id="event-name"
            label="Event name"
            hint="This is spoken at the start of every certificate, so write it the way you would say it aloud."
          >
            {(props) => (
              <Input {...props} name="name" required placeholder="Curious Minds 2026" />
            )}
          </Field>
          <Button type="submit" className="self-start">
            Create event
          </Button>
        </form>
      </Card>
    </main>
  );
}
