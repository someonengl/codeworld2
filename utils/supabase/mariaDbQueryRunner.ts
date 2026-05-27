import { db } from '../db';
import crypto from 'crypto';

function formatDbValue(val: any): any {
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
    return val.replace('T', ' ').replace('Z', '').substring(0, 19);
  }
  return val;
}

export interface WhereClause {
  column: string;
  value: any;
  op: string; // 'eq' | 'neq' | 'in' | 'like' etc
}

export interface OrderClause {
  column: string;
  ascending: boolean;
}

export async function executeMariaDbQuery(params: {
  table: string;
  method: 'select' | 'insert' | 'update' | 'delete';
  selectStr?: string;
  data?: any;
  wheres?: WhereClause[];
  orders?: OrderClause[];
  limit?: number;
  single?: boolean;
}) {
  const { table, method, selectStr = '*', data, wheres = [], orders = [], limit, single } = params;

  try {
    // ─── 1. HANDLE INSERT ───────────────────────────────────────────────────
    if (method === 'insert') {
      const rows = Array.isArray(data) ? data : [data];
      const insertedRows: any[] = [];

      for (const row of rows) {
        const copy = { ...row };
        if (!copy.id) {
          copy.id = crypto.randomUUID();
        }

        // Handle JSON fields conversion (e.g. result_data in submissions), booleans, and ISO dates
        for (const key of Object.keys(copy)) {
          if (copy[key] !== null && typeof copy[key] === 'object') {
            copy[key] = JSON.stringify(copy[key]);
          }
          if (typeof copy[key] === 'boolean') {
            copy[key] = copy[key] ? 1 : 0;
          }
          copy[key] = formatDbValue(copy[key]);
        }

        const columns = Object.keys(copy).map(col => `\`${col}\``).join(', ');
        const placeholders = Object.keys(copy).map(() => '?').join(', ');
        const values = Object.values(copy);

        await db.query(
          `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`,
          values
        );

        // Fetch inserted row
        const [fetched] = await db.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [copy.id]);
        if (Array.isArray(fetched) && fetched.length > 0) {
          insertedRows.push(fetched[0]);
        }
      }

      const result = Array.isArray(data) ? insertedRows : insertedRows[0];
      return { data: result, error: null };
    }

    // ─── 2. HANDLE UPDATE ───────────────────────────────────────────────────
    if (method === 'update') {
      const copy = { ...data };
      
      // Convert JSON structures, booleans, and ISO dates
      for (const key of Object.keys(copy)) {
        if (copy[key] !== null && typeof copy[key] === 'object') {
          copy[key] = JSON.stringify(copy[key]);
        }
        if (typeof copy[key] === 'boolean') {
          copy[key] = copy[key] ? 1 : 0;
        }
        copy[key] = formatDbValue(copy[key]);
      }

      const setClause = Object.keys(copy).map(col => `\`${col}\` = ?`).join(', ');
      const setValues = Object.values(copy);

      const sqlParts: string[] = [];
      const queryValues: any[] = [...setValues];

      const localWheres = wheres.filter(w => !w.column.includes('.'));
      if (localWheres.length > 0) {
        const whereClauses = localWheres.map(w => {
          if (w.op === 'in') {
            const formatted = w.value.map((v: any) => formatDbValue(v));
            queryValues.push(...formatted);
            return `\`${w.column}\` IN (${w.value.map(() => '?').join(', ')})`;
          }
          queryValues.push(formatDbValue(w.value));
          return `\`${w.column}\` = ?`;
        });
        sqlParts.push(`WHERE ${whereClauses.join(' AND ')}`);
      }

      const sql = `UPDATE \`${table}\` SET ${setClause} ${sqlParts.join(' ')}`;
      await db.query(sql, queryValues);

      // Fetch the updated records to return
      let selectSql = `SELECT * FROM \`${table}\` `;
      const selectValues: any[] = [];
      const localSelectWheres = wheres.filter(w => !w.column.includes('.'));
      if (localSelectWheres.length > 0) {
        const whereClauses = localSelectWheres.map(w => {
          if (w.op === 'in') {
            const formatted = w.value.map((v: any) => formatDbValue(v));
            selectValues.push(...formatted);
            return `\`${w.column}\` IN (${w.value.map(() => '?').join(', ')})`;
          }
          selectValues.push(formatDbValue(w.value));
          return `\`${w.column}\` = ?`;
        });
        selectSql += `WHERE ${whereClauses.join(' AND ')}`;
      }
      const [updated] = await db.query(selectSql, selectValues);
      const result = Array.isArray(updated) ? (single ? updated[0] : updated) : updated;
      return { data: result, error: null };
    }

    // ─── 3. HANDLE DELETE ───────────────────────────────────────────────────
    if (method === 'delete') {
      const sqlParts: string[] = [];
      const queryValues: any[] = [];

      const localDelWheres = wheres.filter(w => !w.column.includes('.'));
      if (localDelWheres.length > 0) {
        const whereClauses = localDelWheres.map(w => {
          if (w.op === 'in') {
            const formatted = w.value.map((v: any) => formatDbValue(v));
            queryValues.push(...formatted);
            return `\`${w.column}\` IN (${w.value.map(() => '?').join(', ')})`;
          }
          queryValues.push(formatDbValue(w.value));
          return `\`${w.column}\` = ?`;
        });
        sqlParts.push(`WHERE ${whereClauses.join(' AND ')}`);
      }

      const sql = `DELETE FROM \`${table}\` ${sqlParts.join(' ')}`;
      await db.query(sql, queryValues);
      return { data: [], error: null };
    }

    // ─── 4. HANDLE SELECT ───────────────────────────────────────────────────
    if (method === 'select') {
      const sqlParts: string[] = [];
      const queryValues: any[] = [];

      // Build WHERE
      const localSelWheres = wheres.filter(w => !w.column.includes('.'));
      if (localSelWheres.length > 0) {
        const whereClauses = localSelWheres.map(w => {
          if (w.op === 'in') {
            const formatted = w.value.map((v: any) => formatDbValue(v));
            queryValues.push(...formatted);
            return `\`${w.column}\` IN (${w.value.map(() => '?').join(', ')})`;
          }
          queryValues.push(formatDbValue(w.value));
          return `\`${w.column}\` = ?`;
        });
        sqlParts.push(`WHERE ${whereClauses.join(' AND ')}`);
      }

      // Build ORDER
      if (orders.length > 0) {
        const orderClauses = orders.map(o => `\`${o.column}\` ${o.ascending ? 'ASC' : 'DESC'}`);
        sqlParts.push(`ORDER BY ${orderClauses.join(', ')}`);
      }

      // Build LIMIT
      if (limit !== undefined) {
        sqlParts.push(`LIMIT ?`);
        queryValues.push(limit);
      }

      const sql = `SELECT * FROM \`${table}\` ${sqlParts.join(' ')}`;
      const [rowsResult] = await db.query(sql, queryValues);
      const rows = rowsResult as any[];

      if (!Array.isArray(rows)) {
        return { data: rows, error: null };
      }

      // Restore JSON and Boolean values
      for (const row of rows) {
        for (const key of Object.keys(row)) {
          // Check for JSON fields
          if (typeof row[key] === 'string' && (row[key].startsWith('{') || row[key].startsWith('['))) {
            try {
              row[key] = JSON.parse(row[key]);
            } catch {}
          }
          // Convert Tinyint booleans
          if (row[key] === 1 || row[key] === 0) {
            // Check original column type or map known boolean keys
            const knownBooleans = ['is_super_admin', 'allow_view_testcases', 'allow_view_others', 'is_sample', 'is_public', 'is_active', 'is_banned'];
            if (knownBooleans.includes(key)) {
              row[key] = row[key] === 1;
            }
          }
        }
      }

      // ─── 5. APPLICATION-LEVEL RELATION STITCHING (JOINS) ──────────────────
      let resultRows = [...rows];
      
      if (resultRows.length > 0) {
        // Unified Problems Relation Stitching (dynamic joins for problem_translations, test_cases, profiles, groups)
        if (table === 'problems') {
          const problemIds = resultRows.map(r => r.id);
          const teacherIds = resultRows.map(r => r.teacher_id).filter(Boolean);
          const groupIds = resultRows.map(r => r.group_id).filter(Boolean);

          let transArray: any[] = [];
          let testCasesArray: any[] = [];
          let profsArray: any[] = [];
          let groupsArray: any[] = [];

          if (problemIds.length > 0) {
            // 1. Fetch Translations if requested
            if (selectStr.includes('problem_translations')) {
              const [trans] = await db.query(`SELECT * FROM problem_translations WHERE problem_id IN (${problemIds.map(() => '?').join(', ')})`, problemIds);
              transArray = Array.isArray(trans) ? trans : [];
            }

            // 2. Fetch Test Cases if requested
            if (selectStr.includes('test_cases')) {
              const [tcases] = await db.query(`SELECT * FROM test_cases WHERE problem_id IN (${problemIds.map(() => '?').join(', ')})`, problemIds);
              testCasesArray = Array.isArray(tcases) ? tcases : [];
              
              // Handle tinyint conversions for test_cases
              for (const tc of testCasesArray) {
                if (tc.is_sample === 1 || tc.is_sample === 0) {
                  tc.is_sample = tc.is_sample === 1;
                }
              }
            }
          }

          // 3. Fetch Profiles if requested
          if (selectStr.includes('profiles') && teacherIds.length > 0) {
            const [profs] = await db.query(`SELECT id, username FROM profiles WHERE id IN (${teacherIds.map(() => '?').join(', ')})`, teacherIds);
            profsArray = Array.isArray(profs) ? profs : [];
          }

          // 4. Fetch Groups if requested
          if (selectStr.includes('groups') && groupIds.length > 0) {
            const [grps] = await db.query(`SELECT id, name FROM \`groups\` WHERE id IN (${groupIds.map(() => '?').join(', ')})`, groupIds);
            groupsArray = Array.isArray(grps) ? grps : [];
          }

          // Stitch columns conditionally
          resultRows = resultRows.map(problem => {
            const item: any = { ...problem };
            if (selectStr.includes('problem_translations')) {
              item.problem_translations = transArray.filter((t: any) => t.problem_id === problem.id);
            }
            if (selectStr.includes('test_cases')) {
              item.test_cases = testCasesArray.filter((t: any) => t.problem_id === problem.id);
            }
            if (selectStr.includes('profiles')) {
              item.profiles = profsArray.find((p: any) => p.id === problem.teacher_id) || null;
            }
            if (selectStr.includes('groups')) {
              item.groups = groupsArray.find((g: any) => g.id === problem.group_id) || null;
            }
            return item;
          });
        }

        // Pattern B: supabase.from("problems").select("*, group:group_id(allow_view_testcases, allow_view_others)")
        if (table === 'problems' && selectStr.includes('group_id') && selectStr.includes('allow_view_testcases')) {
          const groupIds = resultRows.map(r => r.group_id).filter(Boolean);
          if (groupIds.length > 0) {
            const [grps] = await db.query(`SELECT id, allow_view_testcases, allow_view_others FROM \`groups\` WHERE id IN (${groupIds.map(() => '?').join(', ')})`, groupIds);
            const grpsArray = Array.isArray(grps) ? grps : [];
            resultRows = resultRows.map(problem => ({
              ...problem,
              group: grpsArray.find((g: any) => g.id === problem.group_id) || null
            }));
          } else {
            resultRows = resultRows.map(problem => ({ ...problem, group: null }));
          }
        }

        // Pattern C: supabase.from("submissions").select("*, profiles:student_id(username, full_name, avatar_url)")
        if (table === 'submissions' && selectStr.includes('profiles')) {
          const studentIds = resultRows.map(r => r.student_id);
          if (studentIds.length > 0) {
            const [profs] = await db.query(`SELECT id, username, full_name, avatar_url FROM profiles WHERE id IN (${studentIds.map(() => '?').join(', ')})`, studentIds);
            const profsArray = Array.isArray(profs) ? profs : [];
            resultRows = resultRows.map(sub => ({
              ...sub,
              profiles: profsArray.find((p: any) => p.id === sub.student_id) || null
            }));
          }
        }

        // Pattern D: supabase.from('groups').select('*, memberships(count)').eq('memberships.status', 'pending')
        if (table === 'groups' && selectStr.includes('memberships')) {
          for (const group of resultRows) {
            const [counts]: any = await db.query(`SELECT COUNT(*) as count FROM memberships WHERE group_id = ? AND status = 'pending'`, [group.id]);
            group.memberships = [{ count: counts[0]?.count || 0 }];
          }
        }

        // Pattern E: supabase.from('memberships').select('id, group_id, status, groups(name, join_code)')
        if (table === 'memberships' && selectStr.includes('groups')) {
          const groupIds = resultRows.map(r => r.group_id);
          if (groupIds.length > 0) {
            const [grps] = await db.query(`SELECT id, name, join_code FROM \`groups\` WHERE id IN (${groupIds.map(() => '?').join(', ')})`, groupIds);
            const grpsArray = Array.isArray(grps) ? grps : [];
            resultRows = resultRows.map(mem => ({
              ...mem,
              groups: grpsArray.find((g: any) => g.id === mem.group_id) || null
            }));
          }
        }

        // Pattern F: messages profiles:user_id(username, full_name, avatar_url)
        if (table === 'messages' && selectStr.includes('profiles')) {
          const userIds = resultRows.map(r => r.user_id);
          if (userIds.length > 0) {
            const [profs] = await db.query(`SELECT id, username, full_name, avatar_url FROM profiles WHERE id IN (${userIds.map(() => '?').join(', ')})`, userIds);
            const profsArray = Array.isArray(profs) ? profs : [];
            resultRows = resultRows.map(msg => ({
              ...msg,
              profiles: profsArray.find((p: any) => p.id === msg.user_id) || null
            }));
          }
        }
      }

      const finalResult = single ? resultRows[0] || null : resultRows;
      return { data: finalResult, error: null };
    }

    return { data: null, error: new Error('Unsupported method: ' + method) };

  } catch (err: any) {
    console.error(`❌ MariaDB query error on table ${table} during ${method}:`, err);
    return { data: null, error: err };
  }
}
