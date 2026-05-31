import type Stripe from "stripe";
import { stripe, planForPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { isPaidPlan } from "@/lib/plans";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    await prisma.processedStripeEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const workspaceId = s.metadata?.workspaceId;
        const plan = s.metadata?.plan;
        if (workspaceId && plan && isPaidPlan(plan)) {
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
              plan,
              stripeCustomerId: typeof s.customer === "string" ? s.customer : undefined,
              stripeSubscriptionId:
                typeof s.subscription === "string" ? s.subscription : undefined,
            },
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const active = sub.status === "active" || sub.status === "trialing";
        const plan = planForPriceId(sub.items.data[0]?.price.id);
        await prisma.workspace.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { plan: active && plan ? plan : "free" },
        });
        break;
      }
    }
  } catch {
    await prisma.processedStripeEvent
      .delete({ where: { id: event.id } })
      .catch(() => {});
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
