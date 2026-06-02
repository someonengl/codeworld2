import { NextRequest, NextResponse } from 'next/server';
import { executeMariaDbQuery } from '@/utils/supabase/mariaDbQueryRunner';
import { decryptSession } from '@/utils/auth';
import { db } from '@/utils/db';

// Whitelist of allowed database tables
const ALLOWED_TABLES = [
  'profiles', 'groups', 'memberships', 'problems', 'problem_translations',
  'test_cases', 'contests', 'contest_problems', 'submissions', 'messages',
  'materials', 'announcements', 'topics', 'topic_resources', 'bans'
];

// Strict column name character restriction to prevent SQL Injection in identifiers
const COLUMN_REGEX = /^[a-zA-Z0-9_]+$/;

// In-memory query rate limiter to prevent abuse and DDoS
const dbRateLimit = new Map<string, { count: number; resetTime: number }>();

function checkDbRateLimit(key: string): boolean {
  const now = Date.now();
  const record = dbRateLimit.get(key);
  if (!record || now > record.resetTime) {
    dbRateLimit.set(key, { count: 1, resetTime: now + 60000 });
    return false;
  }
  record.count += 1;
  return record.count > 120; // 120 queries/min limit
}

// Ownership verification helper functions
async function verifyGroupOwnership(groupId: string, teacherId: string): Promise<boolean> {
  if (!groupId) return false;
  const [rows]: any = await db.query('SELECT teacher_id FROM `groups` WHERE id = ?', [groupId]);
  return rows && rows[0]?.teacher_id === teacherId;
}

async function verifyProblemOwnership(problemId: string, teacherId: string): Promise<boolean> {
  if (!problemId) return false;
  const [rows]: any = await db.query('SELECT teacher_id FROM problems WHERE id = ?', [problemId]);
  return rows && rows[0]?.teacher_id === teacherId;
}

export async function POST(request: NextRequest) {
  // 1. Get Client IP/Identifier for Rate Limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  // 2. Validate Session
  const sessionCookie = request.cookies.get('session')?.value;
  const session = decryptSession(sessionCookie || '');

  if (!session) {
    return NextResponse.json(
      { data: null, error: { message: 'Unauthorized database request. Please log in.' } },
      { status: 401 }
    );
  }

  // Rate Limiting Check
  const rateLimitKey = `${session.id}_${ip}`;
  if (checkDbRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { data: null, error: { message: 'Rate limit exceeded (120 queries/min). Slow down!' } },
      { status: 429 }
    );
  }

  // 3. Parse Body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: { message: 'Invalid JSON body.' } }, { status: 400 });
  }

  const { table, method, selectStr, data, wheres, orders, limit, single } = body;

  // 4. Input Sanitization (SQL Injection Mitigation)
  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ data: null, error: { message: 'Forbidden or invalid table identifier.' } }, { status: 400 });
  }

  // Validate column names in wheres
  if (wheres && Array.isArray(wheres)) {
    for (const w of wheres) {
      if (typeof w.column !== 'string' || !COLUMN_REGEX.test(w.column)) {
        return NextResponse.json({ data: null, error: { message: 'SQL Injection Guard: Invalid column in filter clause.' } }, { status: 400 });
      }
    }
  }

  // Validate column names in orders
  if (orders && Array.isArray(orders)) {
    for (const o of orders) {
      if (typeof o.column !== 'string' || !COLUMN_REGEX.test(o.column)) {
        return NextResponse.json({ data: null, error: { message: 'SQL Injection Guard: Invalid column in order clause.' } }, { status: 400 });
      }
    }
  }

  // Validate columns keys in data
  if (data) {
    const validateKeys = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) return true;
      for (const k of Object.keys(obj)) {
        if (!COLUMN_REGEX.test(k)) return false;
      }
      return true;
    };

    const isDataValid = Array.isArray(data) ? data.every(validateKeys) : validateKeys(data);
    if (!isDataValid) {
      return NextResponse.json({ data: null, error: { message: 'SQL Injection Guard: Invalid key name in data payload.' } }, { status: 400 });
    }
  }

  // 5. Fetch User Role & Admin Status from DB (Security Verification)
  let isSuperAdmin = false;
  let userRole = 'normal';
  try {
    const [userRows]: any = await db.query('SELECT role, is_super_admin FROM profiles WHERE id = ?', [session.id]);
    if (userRows && userRows.length > 0) {
      isSuperAdmin = !!userRows[0].is_super_admin;
      userRole = userRows[0].role || 'normal';
    } else {
      return NextResponse.json({ data: null, error: { message: 'Unauthorized. User profile not found.' } }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ data: null, error: { message: 'Database query validation failure.' } }, { status: 500 });
  }

  // 6. Enforce Role & Row-Level Authorization Rules
  if (!isSuperAdmin) {
    // A. Block bans table operations for non-admins
    if (table === 'bans') {
      return NextResponse.json({ data: null, error: { message: 'Forbidden. Admin privileges required.' } }, { status: 403 });
    }

    // B. Block announcements table modifications for non-admins
    if (table === 'announcements' && method !== 'select') {
      return NextResponse.json({ data: null, error: { message: 'Forbidden. Only admins can modify announcements.' } }, { status: 403 });
    }

    // C. Profiles table rules
    if (table === 'profiles') {
      if (method === 'update' || method === 'delete') {
        // Must only update/delete own profile
        const idWhere = wheres?.find((w: any) => w.column === 'id' && w.op === 'eq');
        if (!idWhere || idWhere.value !== session.id) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. You can only modify your own profile.' } }, { status: 403 });
        }
        // Protect administrative columns
        if (data && (data.role !== undefined || data.is_super_admin !== undefined || data.is_banned !== undefined)) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. You cannot self-promote or modify administrative flags.' } }, { status: 403 });
        }
      }
    }

    // D. Classroom Groups rules
    if (table === 'groups') {
      if (method === 'insert') {
        if (userRole !== 'teacher') {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Only teachers can create groups.' } }, { status: 403 });
        }
        data.teacher_id = session.id;
      }
      if (method === 'update' || method === 'delete') {
        const idWhere = wheres?.find((w: any) => w.column === 'id' && w.op === 'eq');
        const isOwner = await verifyGroupOwnership(idWhere?.value, session.id);
        if (!isOwner) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. You do not own this group.' } }, { status: 403 });
        }
      }
    }

    // E. Memberships rules
    if (table === 'memberships') {
      if (method === 'insert') {
        // Enforce joining as student
        data.student_id = session.id;
        if (data.status && data.status !== 'pending') {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Status must default to pending.' } }, { status: 403 });
        }
      }
      if (method === 'update') {
        // Only classroom teacher can approve/reject memberships
        const idWhere = wheres?.find((w: any) => w.column === 'id' && w.op === 'eq');
        if (!idWhere) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Missing membership target id.' } }, { status: 403 });
        }
        const [memRows]: any = await db.query('SELECT group_id FROM memberships WHERE id = ?', [idWhere.value]);
        const isOwner = await verifyGroupOwnership(memRows?.[0]?.group_id, session.id);
        if (!isOwner) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. You do not own the parent group.' } }, { status: 403 });
        }
      }
      if (method === 'delete') {
        // Student can leave, or teacher can remove
        const idWhere = wheres?.find((w: any) => w.column === 'id' && w.op === 'eq');
        if (!idWhere) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Missing membership target id.' } }, { status: 403 });
        }
        const [memRows]: any = await db.query('SELECT student_id, group_id FROM memberships WHERE id = ?', [idWhere.value]);
        const isSelf = memRows?.[0]?.student_id === session.id;
        const isTeacherOwner = await verifyGroupOwnership(memRows?.[0]?.group_id, session.id);
        if (!isSelf && !isTeacherOwner) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Unauthorized to delete this membership.' } }, { status: 403 });
        }
      }
    }

    // F. Problems rules
    if (table === 'problems') {
      if (method === 'insert') {
        if (userRole !== 'teacher') {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Only teachers can create problems.' } }, { status: 403 });
        }
        data.teacher_id = session.id;
      }
      if (method === 'update' || method === 'delete') {
        const idWhere = wheres?.find((w: any) => w.column === 'id' && w.op === 'eq');
        const isOwner = await verifyProblemOwnership(idWhere?.value, session.id);
        if (!isOwner) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. You do not own this problem.' } }, { status: 403 });
        }
      }
    }

    // G. Test Cases rules
    if (table === 'test_cases') {
      if (method === 'select') {
        // Enforce that students cannot query test cases directly. Only teachers who own the problem can.
        const probWhere = wheres?.find((w: any) => w.column === 'problem_id' && w.op === 'eq');
        if (!probWhere) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Problem ID filter is required.' } }, { status: 403 });
        }
        const isOwner = await verifyProblemOwnership(probWhere.value, session.id);
        if (!isOwner) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Access restricted to the problem creator.' } }, { status: 403 });
        }
      }
      if (method === 'insert' || method === 'update' || method === 'delete') {
        const probId = data?.problem_id || wheres?.find((w: any) => w.column === 'problem_id' && w.op === 'eq')?.value;
        if (!probId) {
          const idWhere = wheres?.find((w: any) => w.column === 'id' && w.op === 'eq');
          const [tcRows]: any = await db.query('SELECT problem_id FROM test_cases WHERE id = ?', [idWhere?.value]);
          const isOwner = await verifyProblemOwnership(tcRows?.[0]?.problem_id, session.id);
          if (!isOwner) {
            return NextResponse.json({ data: null, error: { message: 'Forbidden. You do not own the parent problem.' } }, { status: 403 });
          }
        } else {
          const isOwner = await verifyProblemOwnership(probId, session.id);
          if (!isOwner) {
            return NextResponse.json({ data: null, error: { message: 'Forbidden. You do not own the parent problem.' } }, { status: 403 });
          }
        }
      }
    }

    // H. Problem Translations rules
    if (table === 'problem_translations') {
      if (method === 'insert') {
        data.author_id = session.id;
        if (data.status && data.status !== 'Pending') {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Status must default to Pending.' } }, { status: 403 });
        }
      }
      if (method === 'update' || method === 'delete') {
        const idWhere = wheres?.find((w: any) => w.column === 'id' && w.op === 'eq');
        const [transRows]: any = await db.query('SELECT author_id FROM problem_translations WHERE id = ?', [idWhere?.value]);
        if (!transRows || transRows[0]?.author_id !== session.id) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. You did not create this translation.' } }, { status: 403 });
        }
        if (data && data.status !== undefined && data.status !== 'Pending') {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Only admins can approve translations.' } }, { status: 403 });
        }
      }
    }

    // I. Submissions rules
    if (table === 'submissions') {
      if (method === 'select') {
        // Enforce that students can only query their own submissions
        if (userRole !== 'teacher') {
          const studentWhere = wheres?.find((w: any) => w.column === 'student_id' && w.op === 'eq');
          if (!studentWhere || studentWhere.value !== session.id) {
            return NextResponse.json({ data: null, error: { message: 'Forbidden. You can only view your own submissions.' } }, { status: 403 });
          }
        }
      }
      if (method === 'insert') {
        data.student_id = session.id;
      }
      if (method === 'update' || method === 'delete') {
        return NextResponse.json({ data: null, error: { message: 'Forbidden. Submissions are immutable.' } }, { status: 403 });
      }
    }

    // J. Messages rules
    if (table === 'messages') {
      if (method === 'insert') {
        data.user_id = session.id;
      }
      if (method === 'update' || method === 'delete') {
        return NextResponse.json({ data: null, error: { message: 'Forbidden. Chat messages are immutable.' } }, { status: 403 });
      }
    }

    // K. Materials rules
    if (table === 'materials') {
      if (method === 'insert') {
        data.teacher_id = session.id;
        const isOwner = await verifyGroupOwnership(data.group_id, session.id);
        if (!isOwner) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. You do not own this group.' } }, { status: 403 });
        }
      }
      if (method === 'update' || method === 'delete') {
        const idWhere = wheres?.find((w: any) => w.column === 'id' && w.op === 'eq');
        const [matRows]: any = await db.query('SELECT teacher_id FROM materials WHERE id = ?', [idWhere?.value]);
        if (!matRows || matRows[0]?.teacher_id !== session.id) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. You do not own this material.' } }, { status: 403 });
        }
      }
    }

    // L. Topics rules
    if (table === 'topics') {
      if (method === 'insert') {
        data.teacher_id = session.id;
        if (data.status && data.status !== 'Pending') {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Status must default to Pending.' } }, { status: 403 });
        }
      }
      if (method === 'update' || method === 'delete') {
        const idWhere = wheres?.find((w: any) => w.column === 'id' && w.op === 'eq');
        const [topicRows]: any = await db.query('SELECT teacher_id FROM topics WHERE id = ?', [idWhere?.value]);
        if (!topicRows || topicRows[0]?.teacher_id !== session.id) {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. You do not own this topic.' } }, { status: 403 });
        }
        if (data && data.status !== undefined && data.status !== 'Pending') {
          return NextResponse.json({ data: null, error: { message: 'Forbidden. Only admins can approve topics.' } }, { status: 403 });
        }
      }
    }
  }

  // 7. Run query using the MariaDB runner
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

  // 8. Strip Sensitive Outputs for Client Privacy (GDPR Compliance)
  if (result.data) {
    const sanitizeResultRow = (row: any) => {
      if (!row) return;
      // Strip passwords for everyone
      if (row.password_hash !== undefined) {
        delete row.password_hash;
      }
      // Strip emails for everyone except the user themselves and admins
      if (row.email !== undefined && !isSuperAdmin && row.id !== session.id) {
        delete row.email;
      }
    };

    if (Array.isArray(result.data)) {
      result.data.forEach(sanitizeResultRow);
    } else {
      sanitizeResultRow(result.data);
    }
  }

  return NextResponse.json({ data: result.data, error: null });
}
