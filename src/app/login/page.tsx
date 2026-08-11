import type { Metadata } from 'next';

import { Card } from '@/components/ui';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const nextParam = params.next;
  const next = typeof nextParam === 'string' ? nextParam : '/admin';

  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-6">
      <h1 className="mb-2 text-3xl font-bold">Audio Certificates</h1>
      <p className="mb-8 text-ink-soft">
        Certificates that speak, for the Curious Minds National STEM Challenge.
      </p>
      <Card>
        <LoginForm next={next} />
      </Card>
    </main>
  );
}
