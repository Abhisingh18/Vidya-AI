import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/session';
import MockRunner from '@/components/student/mock-runner';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mock test — VidyaAI' };

export default async function MockTestPage({ params }: { params: { id: string } }) {
  if (!(await currentUser())) redirect(`/login?callbackUrl=${encodeURIComponent(`/practice/${params.id}`)}`);
  return <MockRunner id={params.id} />;
}
