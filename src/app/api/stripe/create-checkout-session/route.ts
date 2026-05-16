import { NextResponse } from 'next/server'
import Stripe from 'stripe'

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

  const stripe = getStripe()
  const origin = req.headers.get('origin') ?? process.env.APP_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${origin}/?upgraded=1`,
    cancel_url: `${origin}/pricing?cancelled=1`,
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
