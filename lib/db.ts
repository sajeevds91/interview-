import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Tiny document store. Uses Postgres when DATABASE_URL is set,
 * otherwise a JSON file at ./data/db.json (local / single-server use).
 */
type Doc = Record<string, any>;

interface Store {
  get<T extends Doc>(col: string, id: string): Promise<T | null>;
  list<T extends Doc>(col: string): Promise<T[]>;
  put(col: string, id: string, data: Doc): Promise<void>;
  del(col: string, id: string): Promise<void>;
}

class FileStore implements Store {
  private file = path.join(process.cwd(), "data", "db.json");
  private cache: Record<string, Record<string, Doc>> | null = null;
  private queue: Promise<void> = Promise.resolve();

  private async load() {
    if (this.cache) return this.cache;
    try {
      this.cache = JSON.parse(await fs.readFile(this.file, "utf8"));
    } catch {
      this.cache = {};
    }
    return this.cache!;
  }
  private async save() {
    const data = JSON.stringify(this.cache, null, 2);
    this.queue = this.queue.then(async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true });
      const tmp = this.file + ".tmp";
      await fs.writeFile(tmp, data);
      await fs.rename(tmp, this.file);
    });
    await this.queue;
  }
  async get<T extends Doc>(col: string, id: string): Promise<T | null> {
    const db = await this.load();
    const v = db[col]?.[id];
    return v ? (structuredClone(v) as T) : null;
  }
  async list<T extends Doc>(col: string) {
    const db = await this.load();
    return Object.values(db[col] ?? {}).map((d) => structuredClone(d) as T);
  }
  async put(col: string, id: string, data: Doc) {
    const db = await this.load();
    (db[col] ??= {})[id] = structuredClone(data);
    await this.save();
  }
  async del(col: string, id: string) {
    const db = await this.load();
    delete db[col]?.[id];
    await this.save();
  }
}

class PgStore implements Store {
  private pool: any;
  private ready: Promise<void> | null = null;
  constructor(private url: string) {}
  private async init() {
    if (!this.ready) {
      this.ready = (async () => {
        const { Pool } = await import("pg");
        this.pool = new Pool({
          connectionString: this.url,
          ssl: /localhost|127\.0\.0\.1/.test(this.url) ? undefined : { rejectUnauthorized: false },
          max: 5,
        });
        await this.pool.query(`create table if not exists records (
          collection text not null,
          id text not null,
          data jsonb not null,
          updated_at timestamptz not null default now(),
          primary key (collection, id)
        )`);
      })();
    }
    await this.ready;
  }
  async get<T extends Doc>(col: string, id: string): Promise<T | null> {
    await this.init();
    const r = await this.pool.query("select data from records where collection=$1 and id=$2", [col, id]);
    return (r.rows[0]?.data as T) ?? null;
  }
  async list<T extends Doc>(col: string) {
    await this.init();
    const r = await this.pool.query("select data from records where collection=$1", [col]);
    return r.rows.map((x: any) => x.data as T);
  }
  async put(col: string, id: string, data: Doc) {
    await this.init();
    await this.pool.query(
      `insert into records (collection, id, data, updated_at) values ($1,$2,$3,now())
       on conflict (collection, id) do update set data=excluded.data, updated_at=now()`,
      [col, id, JSON.stringify(data)],
    );
  }
  async del(col: string, id: string) {
    await this.init();
    await this.pool.query("delete from records where collection=$1 and id=$2", [col, id]);
  }
}

const g = globalThis as unknown as { __store?: Store };
export const db: Store = (g.__store ??= process.env.DATABASE_URL ? new PgStore(process.env.DATABASE_URL) : new FileStore());
