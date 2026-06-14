import { BudgetClient } from "./budget-client";

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BudgetClient id={id} />;
}
