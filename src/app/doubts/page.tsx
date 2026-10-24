import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/session';
import DoubtSolver from '@/components/student/doubt-solver';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Doubt Solver — VidyaAI',
  description: 'Snap a photo of any question and get hints, a step-by-step solution and a practice question in your language.',
};

// Student photo doubt solver. ?id=<doubt id> opens a saved doubt.
export default async function DoubtsPage({ searchParams }: { searchParams: { id?: string } }) {
  if (!(await currentUser())) redirect('/login');
  const id = typeof searchParams.id === 'string' && /^[\w-]{1,64}$/.test(searchParams.id) ? searchParams.id : undefined;
  return <DoubtSolver initialId={id} />;
}
