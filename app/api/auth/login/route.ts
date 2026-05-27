import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { verifyPassword } from '@/utils/password';
import { encryptSession } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const emailInput = body.email || body.username;
    const password = body.password;
    
    if (!emailInput || !password) {
      return NextResponse.json({ error: 'Username/Email and Password are required.' }, { status: 400 });
    }

    const input = emailInput.trim().toLowerCase();

    // Query database for the user by email or by username
    let sql = 'SELECT * FROM profiles WHERE email = ?';
    if (!input.includes('@')) {
      sql = 'SELECT * FROM profiles WHERE username = ?';
    }

    let rows: any;
    try {
      const [dbResult] = await db.query(sql, [input]);
      rows = dbResult;
    } catch (dbErr: any) {
      console.error("DB_EXECUTION_FAILURE:", dbErr);
      console.error("DETAILED_LOGIN_ERROR DB_QUERY_FAILURE:", dbErr);
      return NextResponse.json({ error: 'Database connection or query failure.' }, { status: 500 });
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 });
    }

    const user = rows[0];

    // Verify PBKDF2 password hash
    let isPasswordCorrect = false;
    try {
      isPasswordCorrect = verifyPassword(password, user.password_hash);
    } catch (hashErr: any) {
      console.error("DETAILED_LOGIN_ERROR PASSWORD_HASH_DECRYPTION_FAILURE:", hashErr);
      return NextResponse.json({ error: 'Password decryption failure.' }, { status: 500 });
    }

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
    console.error("DETAILED_LOGIN_ERROR:", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
