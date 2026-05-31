import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

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

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const workspaceId = s.metadata?.workspaceId;
      if (workspaceId) {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            plan: "premium",
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
      await prisma.workspace.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { plan: active ? "premium" : "free" },
      });
      break;
    }
  }

  return Response.json({ received: true });
}
