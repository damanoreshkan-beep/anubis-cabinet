import { useEffect, useState, useCallback } from 'preact/hooks'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { T } from '../locales'
import { SkinUploader } from '../components/SkinUploader'
import { SkinPreview3D } from '../components/SkinPreview3D'
import { PresetCards } from '../components/PresetCards'
import { UnlockCard } from '../components/UnlockCard'
import { CAPE_PRESETS } from '../presets'
import { useEntitlements } from '../lib/useEntitlements'

interface Props {
    sb: SupabaseClient
    user: User
    t: T
}

export function CapePage({ sb, user, t }: Props) {
    const [skinSha, setSkinSha] = useState<string | null>(null)
    const [capeSha, setCapeSha] = useState<string | null>(null)
    const [slim, setSlim]       = useState(false)
    const { ent, loading: entLoading } = useEntitlements(sb, user)

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

    async function handleCapeUpload(_sha: string) {
        await refresh()
    }

    async function removeCape() {
        await sb.from('skins').update({ cape_sha: null, updated_at: new Date().toISOString() }).eq('user_id', user.id)
        await refresh()
    }

    // Lock-screen takes over the whole page when the user doesn't have
    // the cape perk yet. We still surface the 3D preview on the right
    // so they can see what their character looks like; only the
    // uploader and preset grid are gated.
    const showLock = !entLoading && !ent.capeUnlocked && !capeSha

    return (
        <div class="space-y-5">
            <h2 class="text-lg font-bold text-white">{t.capeTitle}</h2>

            <div class="grid gap-5 md:grid-cols-[1fr_280px]">
                <div class="space-y-3">
                    {showLock ? (
                        <UnlockCard t={t} kind="cape" />
                    ) : (
                        <>
                            <SkinUploader
                                sb={sb}
                                user={user}
                                t={t}
                                kind="cape"
                                accept="image/png"
                                validateImage={dims => isValidCapeSize(dims.w, dims.h)}
                                onUploaded={handleCapeUpload}
                                label={capeSha ? t.capeReplace : t.capeUpload}
                                hint={t.capeHint}
                            />
                            {capeSha && (
                                <button
                                    type="button"
                                    onClick={removeCape}
                                    class="block mx-auto text-xs text-rose-400 hover:text-rose-300 hover:underline"
                                >
                                    {t.capeRemove}
                                </button>
                            )}
                        </>
                    )}
                </div>

                <div class="flex flex-col items-center gap-2">
                    <SkinPreview3D skinUrl={skinUrl} capeUrl={capeUrl} slim={slim} walking />
                    <p class="text-[11px] text-gray-500 text-center">{t.skinPreviewHint}</p>
                </div>
            </div>

            {/* Preset shelf stays visible — clicking one still goes
                through the upload function, which is the authoritative
                gate. Locked users get a server-side 403, which the
                preset cards already display as a clear error. Hiding
                the shelf would just dilute the discoverability of what
                they can unlock. */}
            <div class="pt-5 border-t border-brand-500/15 space-y-3">
                <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400">{t.presetsTitle}</h3>
                <PresetCards
                    sb={sb} user={user} t={t}
                    kind="cape"
                    items={CAPE_PRESETS}
                    onApplied={async () => { await refresh() }}
                />
            </div>
        </div>
    )
}

function isValidCapeSize(w: number, h: number) {
    return (w === 64 && h === 32) || (w === 128 && h === 64)
}
