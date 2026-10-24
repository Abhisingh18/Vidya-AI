import { Presentation } from 'lucide-react';
import GenerateForm from '@/components/teacher/generate-form';
import { SlidesDemo } from '@/components/teacher/create-demos';
import DocList from '@/components/teacher/doc-list';
import StudyShell, { StudySection } from '@/components/student/study-shell';

export default function SlidesPage({ searchParams }: { searchParams: { topic?: string } }) {
  return (
    <StudyShell glyphs={['▶', '📊', '1/10', '✦', '🖼️', '→']} eyebrow="For teachers" theme="plan" icon={<Presentation />} title="Lecture Slides" subtitle="A ready-to-teach deck you can edit, present or download.">
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <GenerateForm type="slides" defaultTopic={searchParams.topic} />
        <div className="lg:sticky lg:top-5"><SlidesDemo /></div>
      </div>
      <StudySection title="Your decks">
        <DocList type="slides" />
      </StudySection>
    </StudyShell>
  );
}
