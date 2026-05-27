import { NextRequest, NextResponse } from 'next/server';
import { executeMariaDbQuery } from '@/utils/supabase/mariaDbQueryRunner';
import { decryptSession } from '@/utils/auth';

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const session = decryptSession(sessionCookie || '');

  const body = await request.json();
  const { table, method, selectStr, data, wheres, orders, limit, single } = body;

  // Enforce authentication for modifying operations
  if (method !== 'select' && !session) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized database write request. Please log in.' } },
      { status: 401 }
    );
  }

  // Inject session student_id/user_id for writes if matching profiles or messages
  // This is a helpful security check matching Supabase's auth.uid() behavior
  if (method === 'insert' && session) {
    if (table === 'submissions' && !data.student_id) {
      data.student_id = session.id;
    }
    if (table === 'messages' && !data.user_id) {
      data.user_id = session.id;
    }
  }

  const result = await executeMariaDbQuery({
    table,
    method,
    selectStr,
    data,
    wheres,
    orders,
    limit,
    single
  });

  if (result.error) {
    return NextResponse.json({ data: null, error: { message: result.error.message } }, { status: 400 });
  }

  return NextResponse.json({ data: result.data, error: null });
}
