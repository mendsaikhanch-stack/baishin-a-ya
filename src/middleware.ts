import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const PROTECTED = ['/account']

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  if (!PROTECTED.some((p) => path.startsWith(p))) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: CookieToSet[]) =>
          list.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          ),
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const login = req.nextUrl.clone()
    login.pathname = '/login'
    login.searchParams.set('next', path)
    return NextResponse.redirect(login)
  }

  return res
}

export const config = {
  matcher: ['/account/:path*'],
}
