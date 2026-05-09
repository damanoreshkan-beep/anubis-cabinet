import { useEffect, useState, useCallback } from 'preact/hooks'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { T } from '../locales'
import { SkinUploader } from '../components/SkinUploader'
import { SkinPreview3D } from '../components/SkinPreview3D'

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

    async function handleSkinUpload(sha: string) {
        await sb.from('skins').update({ skin_sha: sha, updated_at: new Date().toISOString() }).eq('user_id', user.id)
        await refresh()
    }

    async function removeSkin() {
        await sb.from('skins').update({ skin_sha: null, updated_at: new Date().toISOString() }).eq('user_id', user.id)
        await refresh()
    }

    return (
        <div class="space-y-5">
            <h2 class="text-lg font-bold text-white">{t.skinTitle}</h2>

            <div class="grid gap-5 md:grid-cols-[1fr_280px]">
                <div class="space-y-3">
                    <SkinUploader
                        sb={sb}
                        user={user}
                        t={t}
                        accept="image/png"
                        validateImage={img => isValidSkinSize(img)}
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
                </div>

                <div class="flex flex-col items-center gap-2">
                    <SkinPreview3D skinUrl={skinUrl} capeUrl={capeUrl} slim={slim} />
                    <p class="text-[11px] text-gray-500 text-center">{t.skinPreviewHint}</p>
                </div>
            </div>
        </div>
    )
}

function isValidSkinSize(img: HTMLImageElement) {
    const w = img.naturalWidth, h = img.naturalHeight
    // Classic 64×64, legacy 64×32, HD 128×128 (and 128×64 legacy HD).
    return (w === 64 && h === 64) || (w === 64 && h === 32) || (w === 128 && h === 128) || (w === 128 && h === 64)
}
