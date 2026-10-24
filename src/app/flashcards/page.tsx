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
    <StudyShell icon={<Layers />} badge="Flashcards" title="Remember more with" accent="smart flashcards"
      subtitle="Make a deck from any topic, your notes or a video lesson. Review a few minutes a day — each card comes back just before you'd forget it."
      perks={[{ emoji: '🧠', text: 'Spaced repetition' }, { emoji: '📎', text: 'From your notes or PDF' }, { emoji: '🎬', text: 'From any lesson video' }, { emoji: '🌐', text: '23 languages' }]}>
      <StudyCreateForm kind="flashcards" videoId={video} notesId={notes} defaultTopic={topic} />
      <StudySection title="Your decks" hint="Open a deck to review the cards due today">
        <FlashcardDeckList />
      </StudySection>
    </StudyShell>
  );
}
