import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/session';
import PlannerView from '@/components/student/planner-view';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My study plan — VidyaAI' };

export default async function PlanPage({ params }: { params: { id: string } }) {
  if (!(await currentUser())) redirect(`/login?callbackUrl=${encodeURIComponent(`/planner/${params.id}`)}`);
  return <PlannerView id={params.id} />;
}
