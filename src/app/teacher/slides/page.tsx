import { Presentation } from 'lucide-react';
import { PageHeader, TeacherPage } from '@/components/teacher/ui';
import GenerateForm from '@/components/teacher/generate-form';
import DocList from '@/components/teacher/doc-list';

export default function SlidesPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <TeacherPage>
      <PageHeader icon={<Presentation className="w-5 h-5" />} title="Lecture Slides"
        subtitle="Generate a ready-to-teach deck, edit every slide, present in class or download as PowerPoint." />
      <GenerateForm type="slides" defaultTopic={searchParams.topic} />
      <h2 className="font-heading font-semibold text-navy dark:text-dark-text mt-10 mb-4">Your decks</h2>
      <DocList type="slides" />
    </TeacherPage>
  );
}
