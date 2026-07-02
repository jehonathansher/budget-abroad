const CACHE_KEY = 'er-cache'
const CACHE_TTL = 6 * 60 * 60 * 1000

interface Cache { rates: Record<string, number>; ts: number }

let memCache: Cache | null = null

async function getRates(): Promise<Record<string, number>> {
  const now = Date.now()
  if (memCache && now - memCache.ts < CACHE_TTL) return memCache.rates
  try {
    const stored = localStorage.getItem(CACHE_KEY)
    if (stored) {
      const c: Cache = JSON.parse(stored)
      if (now - c.ts < CACHE_TTL) { memCache = c; return c.rates }
    }
  } catch {}
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    const data = await res.json()
    const cache: Cache = { rates: data.rates, ts: now }
    memCache = cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    return cache.rates
  } catch {
    return memCache?.rates ?? {}
  }
}

export async function convert(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount
  const rates = await getRates()
  const fromRate = rates[from] ?? 1
  const toRate = rates[to] ?? 1
  return (amount / fromRate) * toRate
}
