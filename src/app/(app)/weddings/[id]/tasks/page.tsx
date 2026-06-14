import { TasksClient } from "./tasks-client";

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TasksClient id={id} />;
}
