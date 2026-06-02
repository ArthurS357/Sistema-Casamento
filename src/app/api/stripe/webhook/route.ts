import type Stripe from "stripe";
import { stripe, planForPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { isPaidPlan } from "@/lib/plans";

// Webhook precisa do raw body e nunca pode ser cacheado pelo App Router.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    console.error("[stripe-webhook] assinatura/segredo ausente — request rejeitada");
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    // Auditoria: assinatura inválida pode indicar replay/forja. Loga e barra.
    const reason = err instanceof Error ? err.message : "unknown";
    console.error(`[stripe-webhook] assinatura inválida: ${reason}`);
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
        // workspaceId/plan vêm do metadata; client_reference_id é fallback.
        const workspaceId = s.metadata?.workspaceId ?? s.client_reference_id ?? undefined;
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
          console.info(`[stripe-webhook] workspace ${workspaceId} → plano ${plan}`);
        } else {
          // Auditoria: pagamento sem metadata utilizável não atualiza nada.
          console.warn(
            `[stripe-webhook] checkout ${event.id} sem workspaceId/plan válidos — ignorado`,
          );
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
  } catch (err) {
    // Falha no handler: libera o registro de idempotência p/ o Stripe reenviar.
    const reason = err instanceof Error ? err.message : "unknown";
    console.error(`[stripe-webhook] handler falhou (${event.type}): ${reason}`);
    await prisma.processedStripeEvent
      .delete({ where: { id: event.id } })
      .catch(() => {});
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
