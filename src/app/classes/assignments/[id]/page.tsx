import AssignmentView from '@/components/teacher/assignment-view';

export default function StudentAssignment({ params }: { params: { id: string } }) {
  return <AssignmentView id={params.id} />;
}
