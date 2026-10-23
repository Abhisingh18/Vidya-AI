import { redirect } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import { currentUser } from '@/lib/session';
import { PageHeader, TeacherPage } from '@/components/teacher/ui';
import MockCreateForm from '@/components/student/mock-create-form';
import MockList from '@/components/student/mock-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mock tests — VidyaAI' };

export default async function PracticePage({ searchParams }: { searchParams: { topic?: string; subject?: string; length?: string } }) {
  if (!(await currentUser())) redirect(`/login?callbackUrl=${encodeURIComponent('/practice')}`);
  return (
    <TeacherPage>
      <PageHeader icon={<ClipboardCheck className="w-5 h-5" />} title="Mock Tests"
        subtitle="Timed practice tests from your chapters or syllabus. MCQs are checked instantly, written answers get AI feedback, and you see exactly which chapters need work." />
      <MockCreateForm
        defaultTopics={typeof searchParams.topic === 'string' ? searchParams.topic.slice(0, 2000) : ''}
        defaultSubject={typeof searchParams.subject === 'string' ? searchParams.subject.slice(0, 100) : ''}
        defaultLength={searchParams.length} />
      <h2 className="font-heading font-semibold text-navy dark:text-dark-text mt-10 mb-4">Your tests</h2>
      <MockList />
    </TeacherPage>
  );
}
