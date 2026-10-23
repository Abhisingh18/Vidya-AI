import AssignmentView from '@/components/teacher/assignment-view';

export default function TeacherAssignment({ params }: { params: { id: string } }) {
  return <AssignmentView id={params.id} />;
}
