// Janela deslizante simples por chave (IP ou token). Suficiente para um painel interno.
export class RateLimiter {
  private hits = new Map<string, number[]>()
  constructor(private perMinute: number) {}
  allow(key: string): boolean {
    const now = Date.now()
    const arr = (this.hits.get(key) ?? []).filter((t) => now - t < 60_000)
    if (arr.length >= this.perMinute) {
      this.hits.set(key, arr)
      return false
    }
    arr.push(now)
    this.hits.set(key, arr)
    if (this.hits.size > 5000) this.hits.clear()
    return true
  }
}
