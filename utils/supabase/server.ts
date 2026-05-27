import { executeMariaDbQuery } from './mariaDbQueryRunner';
import { decryptSession } from '../auth';

class ServerQueryBuilder {
  private table: string;
  private selectStr: string = '*';
  private wheres: any[] = [];
  private orders: any[] = [];
  private limitVal?: number;
  private isSingle = false;
  private method: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private data: any = null;

  private countOption?: string;
  private headOption = false;

  constructor(table: string) {
    this.table = table;
  }

  select(selectStr: string = '*', options?: { count?: string; head?: boolean }) {
    if (this.method !== 'insert' && this.method !== 'update' && this.method !== 'delete') {
      this.method = 'select';
    }
    this.selectStr = selectStr;
    if (options) {
      this.countOption = options.count;
      this.headOption = !!options.head;
    }
    return this;
  }

  eq(column: string, value: any) {
    if (value !== undefined && value !== null) {
      this.wheres.push({ column, value, op: 'eq' });
    }
    return this;
  }

  neq(column: string, value: any) {
    if (value !== undefined && value !== null) {
      this.wheres.push({ column, value, op: 'neq' });
    }
    return this;
  }

  in(column: string, value: any[]) {
    if (value !== undefined && value !== null && value.length > 0) {
      this.wheres.push({ column, value, op: 'in' });
    }
    return this;
  }

  order(column: string, options: { ascending: boolean } = { ascending: true }) {
    this.orders.push({ column, ascending: options.ascending });
    return this;
  }

  limit(limitVal: number) {
    this.limitVal = limitVal;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  // Promise-like behavior to allow directly awaiting the builder instance
  async then(onfulfilled?: any, onrejected?: any) {
    try {
      const result = await executeMariaDbQuery({
        table: this.table,
        method: this.method,
        selectStr: this.selectStr,
        wheres: this.wheres,
        orders: this.orders,
        limit: this.limitVal,
        single: this.isSingle,
        data: this.data
      });
      if (result.error) {
        throw result.error;
      }
      const finalResult: any = { ...result };
      if (this.countOption) {
        finalResult.count = Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0);
        if (this.headOption) {
          finalResult.data = null;
        }
      }
      return onfulfilled ? onfulfilled(finalResult) : finalResult;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  insert(data: any) {
    this.method = 'insert';
    this.data = data;
    return this;
  }

  update(data: any) {
    this.method = 'update';
    this.data = data;
    return this;
  }

  delete() {
    this.method = 'delete';
    return this;
  }
}

class CustomServerClient {
  private session: any = null;

  constructor(cookieStore: any) {
    const sessionToken = cookieStore?.get?.('session')?.value;
    if (sessionToken) {
      this.session = decryptSession(sessionToken);
    }
  }

  auth = {
    getUser: async () => {
      if (!this.session) {
        return { data: { user: null }, error: new Error('No authenticated session') };
      }
      const user = {
        id: this.session.id,
        email: this.session.email,
        role: this.session.role,
        user_metadata: {
          username: this.session.username,
          full_name: this.session.full_name
        }
      };
      return { data: { user }, error: null };
    },
    getSession: async () => {
      if (!this.session) {
        return { data: { session: null }, error: new Error('No authenticated session') };
      }
      const user = {
        id: this.session.id,
        email: this.session.email,
        role: this.session.role,
        user_metadata: {
          username: this.session.username,
          full_name: this.session.full_name
        }
      };
      return {
        data: {
          session: {
            user,
            access_token: 'local-session-token'
          }
        },
        error: null
      };
    }
  };

  from(table: string): any {
    return new ServerQueryBuilder(table);
  }
}

export const createClient = (cookieStore: any) => {
  return new CustomServerClient(cookieStore);
};
export const createAdminClient = () => {
  return new CustomServerClient(null);
};
export const createServerClient = () => {
  return new CustomServerClient(null);
};
