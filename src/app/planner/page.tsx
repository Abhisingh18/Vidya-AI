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
    <StudyShell icon={<CalendarDays />} badge="Study planner" title="Be exam-ready with a" accent="day-by-day plan"
      subtitle="Tell us your exam date, subjects and daily time — get a plan with lessons, practice, revision and mock tests that re-plans if you fall behind."
      perks={[{ emoji: '📅', text: 'Day-by-day' }, { emoji: '🔁', text: 'Auto re-plan' }, { emoji: '✅', text: 'Tick off tasks, earn XP' }, { emoji: '🎯', text: 'Mock tests built in' }]}>
      <PlannerCreateForm />
      <StudySection title="Your plans" hint="Open a plan to see today's tasks">
        <PlannerList />
      </StudySection>
    </StudyShell>
  );
}
