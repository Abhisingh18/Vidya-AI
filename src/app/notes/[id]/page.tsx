import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/session';
import NotesSheet from '@/components/student/notes-sheet';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Revision sheet — VidyaAI' };

export default async function NotesSheetPage({ params }: { params: { id: string } }) {
  if (!(await currentUser())) redirect(`/login?callbackUrl=${encodeURIComponent(`/notes/${params.id}`)}`);
  return <NotesSheet id={params.id} />;
}
