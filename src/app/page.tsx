import Link from 'next/link';

/**
 * The bare domain. Anyone arriving here is either a team member on their way to
 * sign in, or someone who was sent a certificate link and dropped the last part
 * of the address -- so both get an answer.
 */
export default function HomePage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-16">
      <h1 className="text-4xl font-bold">Audio Certificates</h1>
      <p className="mt-4 text-xl leading-relaxed">
        Certificates that speak, made for the Curious Minds National STEM Challenge — a challenge
        for students with visual impairment and their teachers, presented by Vividha Trust.
      </p>
      <p className="mt-6 text-lg text-ink-soft">
        If someone sent you a certificate, open the full link they gave you. It will read the
        certificate aloud, applause and all.
      </p>
      <p className="mt-8">
        <Link
          href="/admin"
          className="inline-flex min-h-14 items-center rounded-lg bg-teal-800 px-6 text-lg font-bold text-white hover:bg-teal-900"
        >
          Team sign in
        </Link>
      </p>
    </main>
  );
}
