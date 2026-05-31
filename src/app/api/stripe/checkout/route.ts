import { z } from "zod";
import { stripe, STRIPE_PRICE_BY_PLAN } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { PAID_PLANS } from "@/lib/plans";
import {
  requireUserId,
  getActiveWorkspaceId,
  errorResponse,
} from "@/lib/auth/guards";

const checkoutSchema = z.object({ plan: z.enum(PAID_PLANS) });

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const workspaceId = await getActiveWorkspaceId(userId);
    const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!ws) return Response.json({ error: "WorkspaceNotFound" }, { status: 404 });

    const { plan } = checkoutSchema.parse(await req.json());
    const price = STRIPE_PRICE_BY_PLAN[plan];
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
      metadata: { workspaceId, plan },
    });
    return Response.json({ url: session.url });
  } catch (e) {
    return errorResponse(e);
  }
}
