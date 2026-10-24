import { redirect } from 'next/navigation';
import { NotebookText } from 'lucide-react';
import { currentUser } from '@/lib/session';
import StudyShell, { StudySection } from '@/components/student/study-shell';
import StudyCreateForm from '@/components/student/flashcard-create-form';
import NotesList from '@/components/student/notes-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Revision notes — VidyaAI' };

const param = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v.slice(0, 40) : undefined);

export default async function NotesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const video = param(searchParams.video);
  if (!(await currentUser())) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/notes${video ? `?video=${encodeURIComponent(video)}` : ''}`)}`);
  }
  return (
    <StudyShell theme="notes" icon={<NotebookText />} title="Revision Notes"
      subtitle="A one-page sheet for any topic, your notes or a lesson: key points, formulas, a mind map, memory tricks and a self-check.">
      <StudyCreateForm kind="notes" videoId={video} />
      <StudySection title="Your revision sheets" hint="Edit, print or turn a sheet into flashcards">
        <NotesList />
      </StudySection>
    </StudyShell>
  );
}
