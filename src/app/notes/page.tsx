import { redirect } from 'next/navigation';
import { NotebookText } from 'lucide-react';
import { currentUser } from '@/lib/session';
import { PageHeader, TeacherPage } from '@/components/teacher/ui';
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
    <TeacherPage>
      <PageHeader icon={<NotebookText className="w-5 h-5" />} title="Revision Notes"
        subtitle="A one-page sheet for any topic, your notes or a video lesson: key points, terms, formulas, a mind map, memory tricks and a quick self-check." />
      <StudyCreateForm kind="notes" videoId={video} />
      <h2 className="font-heading font-semibold text-navy dark:text-dark-text mt-10 mb-4">Your revision sheets</h2>
      <NotesList />
    </TeacherPage>
  );
}
