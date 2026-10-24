import { Presentation } from 'lucide-react';
import GenerateForm from '@/components/teacher/generate-form';
import DocList from '@/components/teacher/doc-list';
import StudyShell, { StudySection } from '@/components/student/study-shell';

export default function SlidesPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <StudyShell eyebrow="For teachers" theme="plan" icon={<Presentation />} title="Lecture Slides" subtitle="A ready-to-teach deck you can edit, present or download.">
      <GenerateForm type="slides" defaultTopic={searchParams.topic} />
      <StudySection title="Your decks">
        <DocList type="slides" />
      </StudySection>
    </StudyShell>
  );
}
