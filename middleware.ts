import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Security Check (Banned Identity & IP)
  const isProtectedPath = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/archive') || 
                          request.nextUrl.pathname.startsWith('/solve')

  if (isProtectedPath && !request.nextUrl.pathname.startsWith('/banned')) {
    
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const origin = `${proto}://${host}`;

    // Check Profile Ban
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_banned').eq('id', user.id).maybeSingle();
      if (profile?.is_banned) {
        return NextResponse.redirect(new URL('/banned', origin));
      }
    }

    // Check IP Ban
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || (request as any).ip;
    if (ip) {
      const { data: ban } = await supabase.from('bans').select('id').eq('target_value', ip).eq('type', 'ip').maybeSingle();
      if (ban) {
        return NextResponse.redirect(new URL('/banned', origin));
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
