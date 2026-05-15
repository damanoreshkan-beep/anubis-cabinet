// Lock screen shown when the user tries to use a paid perk (cape
// upload, HD skin upload) without the matching entitlement. Mirrors
// the pattern of the donation tier cards in the payments widget —
// price in UAH plus rough USD / RUB conversion, primary CTA that
// opens the donate modal, and a "already paid?" footer linking to the
// Telegram support handle.
//
// "Open donate modal" is dispatched as a document-level CustomEvent
// (`anubis-open-donate`). The host (partner site, launcher) listens
// and reacts however it wants — partner shows the modal, launcher
// jumps to the Donate tab. If nobody listens, we open a new tab to
// the partner-site #donate hash as a fallback.
import { useEffect, useState } from 'preact/hooks'
import type { T } from '../locales'
import { fetchRates, readCachedRates, isFresh, type Rates } from '../lib/rates'

interface Props {
    t: T
    /** Which lock this card represents. Determines copy and price. */
    kind: 'cape' | 'hdSkin'
}

const DONATE_FALLBACK_URL = 'https://vitmostovoy-rgb.github.io/minecraft/#donate'
const SUPPORT_TG_URL      = 'https://t.me/AnubisWorld_Support'
const SUPPORT_TG_HANDLE   = '@AnubisWorld_Support'

export function UnlockCard({ t, kind }: Props) {
    const title    = kind === 'cape' ? t.lockCapeTitle    : t.lockHdSkinTitle
    const body     = kind === 'cape' ? t.lockCapeBody     : t.lockHdSkinBody
    const priceUah = kind === 'cape' ? t.lockPriceCape    : t.lockPriceHdSkin

    // Same conversion logic as the payments widget — share the
    // localStorage cache, paint instantly on revisit.
    const [rates, setRates] = useState<Rates | null>(() => readCachedRates())
    useEffect(() => {
        if (isFresh(rates)) return
        let cancelled = false
        fetchRates().then(r => { if (!cancelled) setRates(r) }).catch(() => {})
        return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const usd = rates ? (priceUah * rates.USD).toFixed(2) : null
    const rub = rates ? Math.round(priceUah * rates.RUB)  : null

    const onSupport = () => {
        // Host hook first: if a listener fills `handled = true` we
        // consider it dealt with and skip the new-tab fallback.
        const detail: { handled?: boolean } = {}
        const ev = new CustomEvent('anubis-open-donate', { detail, bubbles: true, composed: true })
        document.dispatchEvent(ev)
        if (!detail.handled) {
            window.open(DONATE_FALLBACK_URL, '_blank', 'noopener,noreferrer')
        }
    }

    return (
        <div class="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/0 p-6 sm:p-7 space-y-4">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-11V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-base font-bold text-white">{title}</h3>
                    <p class="text-sm text-gray-300 leading-relaxed mt-1">{body}</p>
                </div>
            </div>

            <div class="text-center py-3">
                <div class="text-3xl font-bold gold-text leading-none">{priceUah} ₴</div>
                {usd && rub && (
                    <div class="text-sm text-gray-300 mt-2 flex items-center justify-center gap-2 flex-wrap">
                        <span>≈&nbsp;{rub}&nbsp;₽</span>
                        <span class="text-brand-400/40">/</span>
                        <span>≈&nbsp;${usd}</span>
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={onSupport}
                class="btn-glow w-full inline-flex justify-center items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold px-5 py-3 rounded-xl text-sm shadow-lg shadow-brand-600/30"
            >
                {t.lockBuyCta}
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                </svg>
            </button>

            <div class="text-center text-xs text-gray-500">
                {t.lockSupportPrefix}{' '}
                <a href={SUPPORT_TG_URL} target="_blank" rel="noopener noreferrer"
                   class="text-brand-300 hover:text-brand-200 font-mono">
                    {SUPPORT_TG_HANDLE}
                </a>
            </div>
        </div>
    )
}
