import { GuestsClient } from "./guests-client";

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GuestsClient id={id} />;
}
