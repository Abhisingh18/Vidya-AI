import { ClipboardList } from 'lucide-react';
import GenerateForm from '@/components/teacher/generate-form';
import DocList from '@/components/teacher/doc-list';
import StudyShell, { StudySection } from '@/components/student/study-shell';

export default function QuizzesPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <StudyShell theme="plan" icon={<ClipboardList />} title="Quizzes & Worksheets" subtitle="Questions with an answer key. Edit, print or assign.">
      <GenerateForm type="quiz" defaultTopic={searchParams.topic} />
      <StudySection title="Your quizzes">
        <DocList type="quiz" />
      </StudySection>
    </StudyShell>
  );
}
