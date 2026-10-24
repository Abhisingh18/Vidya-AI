import { redirect } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import { currentUser } from '@/lib/session';
import StudyShell, { StudySection } from '@/components/student/study-shell';
import MockCreateForm from '@/components/student/mock-create-form';
import MockList from '@/components/student/mock-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mock tests — VidyaAI' };

export default async function PracticePage({ searchParams }: { searchParams: { topic?: string; subject?: string; length?: string } }) {
  if (!(await currentUser())) redirect(`/login?callbackUrl=${encodeURIComponent('/practice')}`);
  return (
    <StudyShell theme="mock" icon={<ClipboardCheck />} title="Mock Tests"
      subtitle="Timed tests from your chapters or syllabus. MCQs are checked instantly, written answers get AI feedback, and you see which chapters need work.">
      <MockCreateForm
        defaultTopics={typeof searchParams.topic === 'string' ? searchParams.topic.slice(0, 2000) : ''}
        defaultSubject={typeof searchParams.subject === 'string' ? searchParams.subject.slice(0, 100) : ''}
        defaultLength={searchParams.length} />
      <StudySection title="Your tests" hint="Retake a test to beat your best score">
        <MockList />
      </StudySection>
    </StudyShell>
  );
}
