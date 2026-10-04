// Tiny in-memory TTL cache with in-flight request de-duplication.
export class Cache {
  constructor() {
    this.store = new Map(); // key -> { value, at }
    this.inflight = new Map();
  }
  get(key) {
    return this.store.get(key);
  }
  set(key, value) {
    this.store.set(key, { value, at: Date.now() });
  }
  age(key) {
    const e = this.store.get(key);
    return e ? Date.now() - e.at : Infinity;
  }
  // Run `loader` once for concurrent callers of the same key.
  dedupe(key, loader) {
    if (this.inflight.has(key)) return this.inflight.get(key);
    const p = Promise.resolve()
      .then(loader)
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }
}
