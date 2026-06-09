import type Stripe from "stripe";
import { stripe, planForPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";

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
        // workspaceId vem do metadata; client_reference_id é fallback.
        const workspaceId = s.metadata?.workspaceId ?? s.client_reference_id ?? undefined;
        if (!workspaceId) {
          console.warn(`[stripe-webhook] checkout ${event.id} sem workspaceId — ignorado`);
          break;
        }
        // O plano é derivado do preço efetivamente pago, nunca do metadata:
        // o metadata é definido na criação do checkout e pode ser forjado.
        const lineItems = await stripe.checkout.sessions.listLineItems(s.id, { limit: 1 });
        const priceId = lineItems.data[0]?.price?.id;
        const plan = planForPriceId(priceId);
        if (!plan) {
          console.error(
            `[stripe-webhook] checkout ${event.id} com price desconhecido (${priceId ?? "ausente"}) — ignorado`,
          );
          break;
        }
        if (s.metadata?.plan && s.metadata.plan !== plan) {
          // Auditoria: divergência indica tentativa de manipulação do checkout.
          console.warn(
            `[stripe-webhook] checkout ${event.id}: metadata.plan (${s.metadata.plan}) diverge do preço pago (${plan}) — gravando o plano do preço`,
          );
        }
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
