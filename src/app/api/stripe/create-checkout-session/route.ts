import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY missing')
  return new Stripe(key)
}

export async function POST(req: Request) {
  if (!process.env.STRIPE_PRO_PRICE_ID) {
    return NextResponse.json(
      { error: 'STRIPE_PRO_PRICE_ID not configured.' },
      { status: 503 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'auth_required' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  const stripe = getStripe()

  let customerId = profile?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email!,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const origin = req.headers.get('origin') ?? process.env.APP_URL!
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${origin}/account?upgraded=1`,
    cancel_url: `${origin}/pricing?cancelled=1`,
    allow_promotion_codes: true,
    metadata: { supabase_user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
