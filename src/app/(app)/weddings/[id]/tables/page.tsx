import { TablesClient } from "./tables-client";

export default async function TablesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TablesClient id={id} />;
}
