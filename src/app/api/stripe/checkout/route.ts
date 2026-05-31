import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import {
  requireUserId,
  getActiveWorkspaceId,
  errorResponse,
} from "@/lib/auth/guards";

export async function POST() {
  try {
    const userId = await requireUserId();
    const workspaceId = await getActiveWorkspaceId(userId);
    const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!ws) return Response.json({ error: "WorkspaceNotFound" }, { status: 404 });

    const price = process.env.STRIPE_PRICE_PREMIUM;
    if (!price)
      return Response.json({ error: "PriceNotConfigured" }, { status: 500 });
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    let customerId = ws.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: ws.name,
        metadata: { workspaceId },
      });
      customerId = customer.id;
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${base}/settings?billing=success`,
      cancel_url: `${base}/settings?billing=cancel`,
      metadata: { workspaceId },
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return errorResponse(e);
  }
}
