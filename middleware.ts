import { type NextRequest, NextResponse } from 'next/server';
import { decryptSession } from './utils/auth';

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  const session = decryptSession(sessionToken || '');

  const isProtectedPath =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/archive') ||
    request.nextUrl.pathname.startsWith('/solve');

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const origin = `${proto}://${host}`;

  if (isProtectedPath) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', origin));
    }
    
    if (session.is_banned && !request.nextUrl.pathname.startsWith('/banned')) {
      return NextResponse.redirect(new URL('/banned', origin));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
