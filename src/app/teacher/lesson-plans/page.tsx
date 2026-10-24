import { NotebookPen } from 'lucide-react';
import GenerateForm from '@/components/teacher/generate-form';
import DocList from '@/components/teacher/doc-list';
import StudyShell, { StudySection } from '@/components/student/study-shell';

export default function LessonPlansPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <StudyShell theme="plan" icon={<NotebookPen />} title="Lesson Plans" subtitle="Objectives, class flow, activities and homework.">
      <GenerateForm type="lesson" defaultTopic={searchParams.topic} />
      <StudySection title="Your lesson plans">
        <DocList type="lesson" />
      </StudySection>
    </StudyShell>
  );
}
