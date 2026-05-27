import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { verifyPassword } from '@/utils/password';
import { encryptSession } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Username/Email and Password are required.' }, { status: 400 });
    }

    const input = email.trim().toLowerCase();

    // Query database for the user by email or by username
    let sql = 'SELECT * FROM profiles WHERE email = ?';
    if (!input.includes('@')) {
      sql = 'SELECT * FROM profiles WHERE username = ?';
    }

    const [rows]: any = await db.query(sql, [input]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 400 });
    }

    const user = rows[0];

    // Verify PBKDF2 password hash
    const isPasswordCorrect = verifyPassword(password, user.password_hash);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 400 });
    }

    // Check ban status
    if (user.is_banned === 1 || user.is_banned === true) {
      return NextResponse.json({ error: 'Your account has been banned from CodeWorld.' }, { status: 403 });
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
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
    console.error('❌ Local login error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
