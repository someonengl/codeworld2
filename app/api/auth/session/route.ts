import { NextRequest, NextResponse } from 'next/server';
import { decryptSession } from '@/utils/auth';

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  const session = decryptSession(sessionToken || '');

  if (!session) {
    return NextResponse.json({ user: null, session: null });
  }

  const user = {
    id: session.id,
    email: session.email,
    role: session.role,
    user_metadata: {
      username: session.username,
      full_name: session.full_name
    }
  };

  return NextResponse.json({
    user,
    session: {
      user,
      access_token: 'local-session-token'
    }
  });
}
