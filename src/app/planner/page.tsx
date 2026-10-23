import { redirect } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { currentUser } from '@/lib/session';
import { PageHeader, TeacherPage } from '@/components/teacher/ui';
import PlannerCreateForm from '@/components/student/planner-create-form';
import PlannerList from '@/components/student/planner-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Study planner — VidyaAI' };

export default async function PlannerPage() {
  if (!(await currentUser())) redirect(`/login?callbackUrl=${encodeURIComponent('/planner')}`);
  return (
    <TeacherPage>
      <PageHeader icon={<CalendarDays className="w-5 h-5" />} title="Study Planner"
        subtitle="Tell us your exam date, subjects and how much time you have — get a day-by-day plan with lessons, practice, revision and mock tests." />
      <PlannerCreateForm />
      <h2 className="font-heading font-semibold text-navy dark:text-dark-text mt-10 mb-4">Your plans</h2>
      <PlannerList />
    </TeacherPage>
  );
}
