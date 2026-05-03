import { NextResponse } from 'next/server'
import { estimate, validateInput } from '@/lib/estimator'

export const runtime = 'nodejs'

function isAuthorized(req: Request): boolean {
  const expected = process.env.INTERNAL_API_SECRET
  if (!expected) return false
  const got = req.headers.get('x-internal-secret')
  return typeof got === 'string' && got === expected
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized.', code: 'unauthorized' },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON.', code: 'invalid_json' },
      { status: 400 },
    )
  }

  const result = validateInput(body)
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: 'invalid_input', field: result.field },
      { status: 400 },
    )
  }

  const output = estimate(result.value)
  return NextResponse.json(output)
}
