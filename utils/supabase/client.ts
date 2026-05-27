class BrowserQueryBuilder {
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
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.table,
          method: this.method,
          selectStr: this.selectStr,
          wheres: this.wheres,
          orders: this.orders,
          limit: this.limitVal,
          single: this.isSingle,
          data: this.data
        })
      });
      const result = await res.json();
      if (result.error) {
        throw new Error(result.error.message || result.error);
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

class CustomBrowserClient {
  auth = {
    getUser: async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        return { data: { user: data.user }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: err };
      }
    },
    getSession: async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        return { data: { session: data.session }, error: null };
      } catch (err: any) {
        return { data: { session: null }, error: err };
      }
    },
    signInWithPassword: async (credentials: { email: string; password?: string }) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        });
        const result = await res.json();
        if (result.error) {
          return { data: null, error: new Error(result.error) };
        }
        return { data: result.data, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
    signUp: async (credentials: { email: string; password?: string; options?: any }) => {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            username: credentials.options?.data?.username,
            full_name: credentials.options?.data?.full_name
          })
        });
        const result = await res.json();
        if (result.error) {
          return { data: null, error: new Error(result.error) };
        }
        return { data: result.data, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
    signOut: async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        return { error: null };
      } catch (err: any) {
        return { error: err };
      }
    },
    onAuthStateChange: (callback: any) => {
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  };

  from(table: string): any {
    return new BrowserQueryBuilder(table);
  }

  channel(name: string): any {
    return {
      on: (event: string, filter: any, callback: any) => {
        return this.channel(name);
      },
      subscribe: () => {
        return {};
      }
    };
  }

  removeChannel(channel: any): void {
    // No-op mock
  }
}

let clientInstance: CustomBrowserClient | null = null;

export const createClient = () => {
  if (typeof window === 'undefined') {
    return new CustomBrowserClient();
  }
  if (!clientInstance) {
    clientInstance = new CustomBrowserClient();
  }
  return clientInstance;
};
