import { ClipboardList } from 'lucide-react';
import GenerateForm from '@/components/teacher/generate-form';
import { QuizDemo } from '@/components/teacher/create-demos';
import DocList from '@/components/teacher/doc-list';
import StudyShell, { StudySection } from '@/components/student/study-shell';

export default function QuizzesPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <StudyShell glyphs={['?', 'A', 'B', 'C', '✓', '10/10']} eyebrow="For teachers" theme="plan" icon={<ClipboardList />} title="Quizzes & Worksheets" subtitle="Questions with an answer key. Edit, print or assign.">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <GenerateForm type="quiz" defaultTopic={searchParams.topic} />
        <div className="lg:sticky lg:top-5"><QuizDemo /></div>
      </div>
      <StudySection title="Your quizzes">
        <DocList type="quiz" />
      </StudySection>
    </StudyShell>
  );
}
