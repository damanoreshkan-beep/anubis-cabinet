import { useEffect, useState, useCallback } from 'preact/hooks'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { T } from '../locales'
import { SkinUploader } from '../components/SkinUploader'
import { SkinPreview3D } from '../components/SkinPreview3D'
import { PresetCards } from '../components/PresetCards'
import { CAPE_PRESETS } from '../presets'

interface Props {
    sb: SupabaseClient
    user: User
    t: T
}

export function CapePage({ sb, user, t }: Props) {
    const [skinSha, setSkinSha] = useState<string | null>(null)
    const [capeSha, setCapeSha] = useState<string | null>(null)
    const [slim, setSlim]       = useState(false)

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

    async function handleCapeUpload(sha: string) {
        await sb.from('skins').update({ cape_sha: sha, updated_at: new Date().toISOString() }).eq('user_id', user.id)
        await refresh()
    }

    async function removeCape() {
        await sb.from('skins').update({ cape_sha: null, updated_at: new Date().toISOString() }).eq('user_id', user.id)
        await refresh()
    }

    return (
        <div class="space-y-5">
            <h2 class="text-lg font-bold text-white">{t.capeTitle}</h2>

            <div class="grid gap-5 md:grid-cols-[1fr_280px]">
                <div class="space-y-3">
                    <SkinUploader
                        sb={sb}
                        user={user}
                        t={t}
                        accept="image/png"
                        validateImage={img => isValidCapeSize(img)}
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
                </div>

                <div class="flex flex-col items-center gap-2">
                    <SkinPreview3D skinUrl={skinUrl} capeUrl={capeUrl} slim={slim} walking />
                    <p class="text-[11px] text-gray-500 text-center">{t.skinPreviewHint}</p>
                </div>
            </div>

            <div class="pt-5 border-t border-brand-500/15 space-y-3">
                <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400">{t.presetsTitle}</h3>
                <PresetCards
                    sb={sb} user={user} t={t}
                    items={CAPE_PRESETS}
                    thumbWidth={64}
                    thumbHeight={32}
                    onApplied={async (_item, sha) => {
                        await sb.from('skins').update({
                            cape_sha: sha,
                            updated_at: new Date().toISOString(),
                        }).eq('user_id', user.id)
                        await refresh()
                    }}
                />
            </div>
        </div>
    )
}

function isValidCapeSize(img: HTMLImageElement) {
    const w = img.naturalWidth, h = img.naturalHeight
    return (w === 64 && h === 32) || (w === 128 && h === 64)
}
