export class SimpleCache<T> {
  private store = new Map<string, { value: T; expiry: number }>()

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    
    if (Date.now() > entry.expiry) {
      this.store.delete(key)
      return undefined
    }
    
    return entry.value
  }

  set(key: string, value: T, ttlMs: number) {
    const expiry = Date.now() + ttlMs
    this.store.set(key, { value, expiry })
  }
}
