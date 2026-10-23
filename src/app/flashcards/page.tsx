import { redirect } from 'next/navigation';
import { Layers } from 'lucide-react';
import { currentUser } from '@/lib/session';
import { PageHeader, TeacherPage } from '@/components/teacher/ui';
import StudyCreateForm from '@/components/student/flashcard-create-form';
import FlashcardDeckList from '@/components/student/flashcard-deck-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Flashcards — VidyaAI' };

const param = (v: string | string[] | undefined) => (typeof v === 'string' && v ? v.slice(0, 40) : undefined);

export default async function FlashcardsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const video = param(searchParams.video);
  const notes = param(searchParams.notes);
  const topic = typeof searchParams.topic === 'string' ? searchParams.topic.slice(0, 200) : undefined;
  if (!(await currentUser())) {
    const back = `/flashcards${video ? `?video=${encodeURIComponent(video)}` : notes ? `?notes=${encodeURIComponent(notes)}` : ''}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(back)}`);
  }
  return (
    <TeacherPage>
      <PageHeader icon={<Layers className="w-5 h-5" />} title="Flashcards"
        subtitle="Make a deck from any topic, your notes or a video lesson. Review a few minutes a day — the app brings each card back just before you'd forget it." />
      <StudyCreateForm kind="flashcards" videoId={video} notesId={notes} defaultTopic={topic} />
      <h2 className="font-heading font-semibold text-navy dark:text-dark-text mt-10 mb-4">Your decks</h2>
      <FlashcardDeckList />
    </TeacherPage>
  );
}
