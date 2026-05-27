import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { hashPassword } from '@/utils/password';
import { encryptSession } from '@/utils/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, full_name } = await request.json();
    
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Missing required credentials' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const [existingEmail]: any = await db.query('SELECT id FROM profiles WHERE email = ?', [cleanEmail]);
    if (existingEmail && existingEmail.length > 0) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
    }

    // Check duplicate username
    const [existingUser]: any = await db.query('SELECT id FROM profiles WHERE username = ?', [cleanUsername]);
    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ error: 'Username already taken.' }, { status: 400 });
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    await db.query(
      `INSERT INTO profiles (id, username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?, 'normal')`,
      [userId, cleanUsername, cleanEmail, passwordHash, full_name || username]
    );

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
