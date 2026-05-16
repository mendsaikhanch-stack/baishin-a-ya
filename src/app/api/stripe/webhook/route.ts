import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY missing')
  return new Stripe(key)
}

// Lazy init — module load үед env vars байхгүй бол build crash болохгүй.
let _supabase: SupabaseClient | null = null
function supabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )
  }
  return _supabase
}

async function applySubscriptionState(sub: Stripe.Subscription) {
  const customerId = sub.customer as string
  const active = ['active', 'trialing'].includes(sub.status)
  const periodEndUnix = sub.items.data[0]?.current_period_end
  const periodEnd =
    typeof periodEndUnix === 'number'
      ? new Date(periodEndUnix * 1000).toISOString()
      : null
  await supabase()
    .from('users')
    .update({
      plan: active ? 'pro' : 'free',
      stripe_subscription_id: sub.id,
      current_period_end: periodEnd,
    })
    .eq('stripe_customer_id', customerId)
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: 'webhook not configured' },
      { status: 400 },
    )
  }
  const raw = await req.text()
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret)
  } catch (e) {
    return NextResponse.json(
      { error: `bad signature: ${(e as Error).message}` },
      { status: 400 },
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (typeof session.subscription === 'string') {
          const sub = await stripe.subscriptions.retrieve(session.subscription)
          await applySubscriptionState(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await applySubscriptionState(event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase()
          .from('users')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq('stripe_customer_id', sub.customer as string)
        break
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[stripe webhook] handler error:', e)
    }
    return NextResponse.json(
      { error: 'handler_failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({ received: true })
}
