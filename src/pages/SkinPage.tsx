import { useEffect, useState, useCallback } from 'preact/hooks'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { T } from '../locales'
import { SkinUploader } from '../components/SkinUploader'
import { SkinPreview3D } from '../components/SkinPreview3D'
import { PresetCards } from '../components/PresetCards'
import { ExternalLinks } from '../components/ExternalLinks'
import { UnlockCard } from '../components/UnlockCard'
import { SKIN_PRESETS, SKIN_LINKS } from '../presets'
import { useEntitlements } from '../lib/useEntitlements'

interface Props {
    sb: SupabaseClient
    user: User
    t: T
    nick: string | null
}

export function SkinPage({ sb, user, t }: Props) {
    const [skinSha, setSkinSha] = useState<string | null>(null)
    const [capeSha, setCapeSha] = useState<string | null>(null)
    const [slim, setSlim]     = useState(false)
    const [hdLockShown, setHdLockShown] = useState(false)
    const { ent } = useEntitlements(sb, user)

    const refresh = useCallback(async () => {
        const { data } = await sb.from('skins').select('skin_sha, cape_sha, slim_model').eq('user_id', user.id).maybeSingle()
        setSkinSha(data?.skin_sha ?? null)
        setCapeSha(data?.cape_sha ?? null)
        setSlim(!!data?.slim_model)
    }, [sb, user.id])

    useEffect(() => { refresh() }, [refresh])

    const supabaseUrl = (sb as any).supabaseUrl as string
    const skinUrl = skinSha ? `${supabaseUrl}/storage/v1/object/public/textures/${user.id}/${skinSha}.png` : null
    const capeUrl = capeSha ? `${supabaseUrl}/storage/v1/object/public/textures/${user.id}/${capeSha}.png` : null

    async function handleSkinUpload(_sha: string) {
        setHdLockShown(false)
        await refresh()
    }

    // Clearing is rare and small; keep it as a direct PostgREST update —
    // the skins table doesn't have the storage gateway's JWT problem.
    async function removeSkin() {
        await sb.from('skins').update({ skin_sha: null, updated_at: new Date().toISOString() }).eq('user_id', user.id)
        await refresh()
    }

    return (
        <div class="space-y-5">
            <h2 class="text-lg font-bold text-white">{t.skinTitle}</h2>

            <div class="grid gap-5 md:grid-cols-[1fr_280px]">
                <div class="space-y-3">
                    {hdLockShown ? (
                        <UnlockCard t={t} kind="hdSkin" />
                    ) : (
                        <>
                            {/* Always-on hint so users learn that HD
                                exists, what it costs, and how to get
                                it — before they bother picking a file
                                and getting bounced. Hidden once the
                                entitlement is granted. */}
                            {!ent.hdSkinUnlocked && <HdHintBanner t={t} />}
                            <SkinUploader
                                sb={sb}
                                user={user}
                                t={t}
                                kind="skin"
                                slim={slim}
                                accept="image/png"
                                validateImage={dims => isValidSkinSize(dims.w, dims.h)}
                                paywallCheck={dims => isHdSkin(dims.w, dims.h) && !ent.hdSkinUnlocked}
                                onPaywall={() => setHdLockShown(true)}
                                onUploaded={handleSkinUpload}
                                label={skinSha ? t.skinReplace : t.skinUpload}
                                hint={t.skinHint}
                            />
                            {skinSha && (
                                <button
                                    type="button"
                                    onClick={removeSkin}
                                    class="block mx-auto text-xs text-rose-400 hover:text-rose-300 hover:underline"
                                >
                                    {t.skinRemove}
                                </button>
                            )}
                            <p class="text-[11px] text-gray-500">
                                {slim ? t.skinModelSlim : t.skinModelDefault}
                            </p>
                        </>
                    )}
                </div>

                <div class="flex flex-col items-center gap-2">
                    <SkinPreview3D skinUrl={skinUrl} capeUrl={capeUrl} slim={slim} />
                    <p class="text-[11px] text-gray-500 text-center">{t.skinPreviewHint}</p>
                </div>
            </div>

            <div class="pt-5 border-t border-brand-500/15 space-y-3">
                <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400">{t.presetsTitle}</h3>
                <PresetCards
                    sb={sb} user={user} t={t}
                    kind="skin"
                    items={SKIN_PRESETS}
                    onApplied={async () => { await refresh() }}
                />
            </div>

            <div class="pt-5 border-t border-brand-500/15">
                <ExternalLinks items={SKIN_LINKS} title={t.externalSkinSites} />
            </div>
        </div>
    )
}

function isValidSkinSize(w: number, h: number) {
    // Classic 64×64, legacy 64×32, HD 128×128 (and 128×64 legacy HD).
    return (w === 64 && h === 64) || (w === 64 && h === 32) || (w === 128 && h === 128) || (w === 128 && h === 64)
}

// Anything 128 or larger in either axis is "HD" — same threshold the
// Edge Function uses for its entitlement gate.
function isHdSkin(w: number, h: number) {
    return w >= 128 || h >= 128
}

// Compact, always-visible hint above the regular uploader so users see
// the HD-skin option before they try to upload one. Clicking it
// dispatches the same `anubis-open-donate` event the UnlockCard uses,
// so hosts (launcher, partner site) route to the donate flow.
function HdHintBanner({ t }: { t: T }) {
    const onSupport = () => {
        const detail: { handled?: boolean } = {}
        const ev = new CustomEvent('anubis-open-donate', { detail, bubbles: true, composed: true })
        document.dispatchEvent(ev)
        if (!detail.handled) {
            window.open('https://vitmostovoy-rgb.github.io/minecraft/#donate', '_blank', 'noopener,noreferrer')
        }
    }
    return (
        <div class="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs">
            <svg class="w-4 h-4 text-amber-300 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-11V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <div class="flex-1 text-gray-300">
                <span class="font-semibold text-white">{t.lockHdSkinTitle}</span>
                <span class="text-gray-400"> · {t.lockPriceHdSkin} ₴</span>
            </div>
            <button
                type="button"
                onClick={onSupport}
                class="text-amber-200 hover:text-amber-100 font-semibold whitespace-nowrap"
            >
                {t.lockBuyCta} →
            </button>
        </div>
    )
}
