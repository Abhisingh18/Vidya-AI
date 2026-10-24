import { redirect } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { currentUser } from '@/lib/session';
import StudyShell, { StudySection } from '@/components/student/study-shell';
import PlannerCreateForm from '@/components/student/planner-create-form';
import PlannerList from '@/components/student/planner-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Study planner — VidyaAI' };

export default async function PlannerPage() {
  if (!(await currentUser())) redirect(`/login?callbackUrl=${encodeURIComponent('/planner')}`);
  return (
    <StudyShell theme="plan" icon={<CalendarDays />} title="Study Planner"
      subtitle="Give your exam date, subjects and daily time — get a day-by-day plan that re-plans itself if you fall behind.">
      <PlannerCreateForm />
      <StudySection title="Your plans" hint="Open a plan to see today's tasks">
        <PlannerList />
      </StudySection>
    </StudyShell>
  );
}
