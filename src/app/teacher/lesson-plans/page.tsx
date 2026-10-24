import { NotebookPen } from 'lucide-react';
import GenerateForm from '@/components/teacher/generate-form';
import { LessonDemo } from '@/components/teacher/create-demos';
import DocList from '@/components/teacher/doc-list';
import StudyShell, { StudySection } from '@/components/student/study-shell';

export default function LessonPlansPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <StudyShell glyphs={['🎯', '⏱', '✏️', '📖', '🧠', '✓']} eyebrow="For teachers" theme="plan" icon={<NotebookPen />} title="Lesson Plans" subtitle="Objectives, class flow, activities and homework.">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <GenerateForm type="lesson" defaultTopic={searchParams.topic} />
        <div className="lg:sticky lg:top-5"><LessonDemo /></div>
      </div>
      <StudySection title="Your lesson plans">
        <DocList type="lesson" />
      </StudySection>
    </StudyShell>
  );
}
