// FX rates against UAH. We hit https://open.er-api.com (no key, daily-
// refreshed) once a day and cache the result in localStorage so the
// price subtitle paints instantly on revisit. The API takes UAH as the
// base, so the rate values are "1 UAH = X currency".

export interface Rates {
    USD: number
    RUB: number
    fetchedAt: number
}

const KEY = 'aw-payments-rates'
const TTL_MS = 24 * 60 * 60 * 1000

export function readCachedRates(): Rates | null {
    if (typeof localStorage === 'undefined') return null
    try {
        const raw = localStorage.getItem(KEY)
        if (!raw) return null
        const r = JSON.parse(raw)
        if (typeof r?.USD !== 'number' || typeof r?.RUB !== 'number') return null
        return r as Rates
    } catch { return null }
}

function writeCache(rates: Rates): void {
    if (typeof localStorage === 'undefined') return
    try { localStorage.setItem(KEY, JSON.stringify(rates)) } catch { /* quota or private mode */ }
}

export function isFresh(rates: Rates | null): boolean {
    return !!rates && Date.now() - rates.fetchedAt < TTL_MS
}

export async function fetchRates(): Promise<Rates> {
    const r = await fetch('https://open.er-api.com/v6/latest/UAH')
    if (!r.ok) throw new Error(`rates http ${r.status}`)
    const j = await r.json()
    if (j.result !== 'success' || !j.rates) throw new Error('rates api failure')
    const usd = j.rates.USD
    const rub = j.rates.RUB
    if (typeof usd !== 'number' || typeof rub !== 'number') throw new Error('rates missing USD/RUB')
    const rates: Rates = { USD: usd, RUB: rub, fetchedAt: Date.now() }
    writeCache(rates)
    return rates
}
