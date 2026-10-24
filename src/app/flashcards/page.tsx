import { redirect } from 'next/navigation';
import { Layers } from 'lucide-react';
import { currentUser } from '@/lib/session';
import StudyShell, { StudySection } from '@/components/student/study-shell';
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
    <StudyShell theme="flash" icon={<Layers />} title="Flashcards"
      subtitle="A deck from any topic, notes or lesson video — each card returns just before you forget it.">
      <StudyCreateForm kind="flashcards" videoId={video} notesId={notes} defaultTopic={topic} />
      <StudySection title="Your decks">
        <FlashcardDeckList />
      </StudySection>
    </StudyShell>
  );
}
