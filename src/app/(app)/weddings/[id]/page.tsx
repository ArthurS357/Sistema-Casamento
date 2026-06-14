import { WeddingHomeClient } from "./wedding-home-client";

export default async function WeddingHome({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WeddingHomeClient id={id} />;
}
