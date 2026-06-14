import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnalyticsClient id={id} />;
}
