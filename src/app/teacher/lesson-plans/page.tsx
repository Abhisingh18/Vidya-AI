import { NotebookPen } from 'lucide-react';
import { PageHeader, TeacherPage } from '@/components/teacher/ui';
import GenerateForm from '@/components/teacher/generate-form';
import DocList from '@/components/teacher/doc-list';

export default function LessonPlansPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <TeacherPage>
      <PageHeader icon={<NotebookPen className="w-5 h-5" />} title="Lesson Plans"
        subtitle="Objectives, a minute-by-minute class flow, activities, assessment and homework — all editable." />
      <GenerateForm type="lesson" defaultTopic={searchParams.topic} />
      <h2 className="font-heading font-semibold text-navy dark:text-dark-text mt-10 mb-4">Your lesson plans</h2>
      <DocList type="lesson" />
    </TeacherPage>
  );
}
