import { ClipboardList } from 'lucide-react';
import { PageHeader, TeacherPage } from '@/components/teacher/ui';
import GenerateForm from '@/components/teacher/generate-form';
import DocList from '@/components/teacher/doc-list';

export default function QuizzesPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <TeacherPage>
      <PageHeader icon={<ClipboardList className="w-5 h-5" />} title="Quizzes & Worksheets"
        subtitle="MCQ, true/false and short-answer questions with an answer key. Edit, print, or assign to a class." />
      <GenerateForm type="quiz" defaultTopic={searchParams.topic} />
      <h2 className="font-heading font-semibold text-navy dark:text-dark-text mt-10 mb-4">Your quizzes</h2>
      <DocList type="quiz" />
    </TeacherPage>
  );
}
