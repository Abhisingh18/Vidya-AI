import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/session';
import FlashcardStudy from '@/components/student/flashcard-study';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Study flashcards — VidyaAI' };

export default async function FlashcardDeckPage({ params }: { params: { id: string } }) {
  if (!(await currentUser())) redirect(`/login?callbackUrl=${encodeURIComponent(`/flashcards/${params.id}`)}`);
  return <FlashcardStudy id={params.id} />;
}
