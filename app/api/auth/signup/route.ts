import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { hashPassword } from '@/utils/password';
import { encryptSession } from '@/utils/auth';
import crypto from 'crypto';

const signupRateLimit = new Map<string, { count: number; resetTime: number }>();

function isSignupRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = signupRateLimit.get(ip);
  if (!record || now > record.resetTime) {
    signupRateLimit.set(ip, { count: 1, resetTime: now + 60000 });
    return false;
  }
  record.count += 1;
  return record.count > 5; // 5 registrations per minute
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (isSignupRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many registration requests. Please try again in a minute.' }, { status: 429 });
    }

    const { email, password, username, full_name } = await request.json();
    
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    let existingEmail: any;
    try {
      const [emailQueryResults]: any = await db.query('SELECT id FROM profiles WHERE email = ?', [cleanEmail]);
      existingEmail = emailQueryResults;
    } catch (err: any) {
      console.error("DB_EXECUTION_FAILURE SELECT_EMAIL:", err);
      return NextResponse.json({ error: 'Database check failed.' }, { status: 500 });
    }

    if (existingEmail && existingEmail.length > 0) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
    }

    // Check duplicate username
    let existingUser: any;
    try {
      const [userQueryResults]: any = await db.query('SELECT id FROM profiles WHERE username = ?', [cleanUsername]);
      existingUser = userQueryResults;
    } catch (err: any) {
      console.error("DB_EXECUTION_FAILURE SELECT_USERNAME:", err);
      return NextResponse.json({ error: 'Database check failed.' }, { status: 500 });
    }

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 400 });
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    try {
      await db.query(
        `INSERT INTO profiles (id, username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?, 'normal')`,
        [userId, cleanUsername, cleanEmail, passwordHash, full_name || username]
      );
    } catch (err: any) {
      console.error("DB_EXECUTION_FAILURE INSERT_PROFILE:", err);
      return NextResponse.json({ error: 'Failed to create user account.' }, { status: 500 });
    }

    const userPayload = {
      id: userId,
      email: cleanEmail,
      username: cleanUsername,
      full_name: full_name || username,
      role: 'normal',
      is_banned: false
    };

    const token = encryptSession(userPayload);

    const response = NextResponse.json({ data: { user: userPayload }, error: null });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return response;
  } catch (err: any) {
    console.error('❌ Sign up error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
