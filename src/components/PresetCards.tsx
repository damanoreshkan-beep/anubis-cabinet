// Preset shelf for the skin / cape pages. Clicking a card fetches the
// preset PNG, then runs it through the same skin-upload Edge Function
// the file uploader uses — which handles validation, SHA-256 hashing,
// storage upload, and skins-row update in one round-trip.
import { useState } from 'preact/hooks'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { T } from '../locales'
import { uploadTexture, TextureKind } from '../lib/uploadTexture'
import { SkinThumbnail2D } from './SkinThumbnail2D'
import { CapeThumbnail2D } from './CapeThumbnail2D'

export interface PresetItem {
    name: string
    url: string
    caption?: string
    /** Skin-only: which model the preset texture is drawn for. */
    model?: 'default' | 'slim'
}

interface Props {
    sb: SupabaseClient
    user: User
    t: T
    kind: TextureKind
    items: PresetItem[]
    thumbWidth?: number
    thumbHeight?: number
    onApplied: (item: PresetItem, sha: string) => Promise<void> | void
}

export function PresetCards({ sb, user: _user, t, kind, items, thumbWidth = 64, thumbHeight = 64, onApplied }: Props) {
    const [busy, setBusy] = useState<string | null>(null)
    const [error, setError] = useState('')

    async function apply(item: PresetItem) {
        setError('')
        setBusy(item.name)
        try {
            const r = await fetch(item.url)
            if (!r.ok) throw new Error(`fetch ${r.status}`)
            const buf = await r.arrayBuffer()
            const sha = await uploadTexture(sb, kind, new Uint8Array(buf), {
                slim: item.model === 'slim',
            })
            await onApplied(item, sha)
        } catch (e: any) {
            setError(`${t.errUploadFailed} ${e?.message ?? String(e)}`)
        } finally {
            setBusy(null)
        }
    }

    return (
        <div class="space-y-3">
            <div class="grid grid-cols-3 gap-3">
                {items.map(item => {
                    const isBusy = busy === item.name
                    return (
                        <button
                            type="button"
                            disabled={!!busy}
                            onClick={() => apply(item)}
                            class="group flex flex-col items-center gap-2 p-3 rounded-2xl border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/12 hover:border-brand-400/55 transition disabled:opacity-50 disabled:cursor-wait"
                        >
                            <div
                                class="rounded-lg overflow-hidden border border-brand-500/20 flex items-center justify-center"
                                style={`width:${thumbWidth * 2}px;height:${thumbHeight * 2}px;background:#0d0a1c`}
                            >
                                {kind === 'skin' ? (
                                    // Front-facing character composite so
                                    // each card looks like a player, not a
                                    // textbook of body parts. The 16×32
                                    // native canvas is 1:2 aspect — keep
                                    // it and let the card bg show around.
                                    <SkinThumbnail2D
                                        url={item.url}
                                        slim={item.model === 'slim'}
                                        width={thumbHeight}
                                        height={thumbHeight * 2}
                                    />
                                ) : kind === 'cape' ? (
                                    // Crop just the visible back face of
                                    // the cape — the rest of the atlas is
                                    // empty padding. Cape is 10:16 native.
                                    <CapeThumbnail2D
                                        url={item.url}
                                        width={Math.round(thumbHeight * 1.25)}
                                        height={thumbHeight * 2}
                                    />
                                ) : (
                                    <img
                                        src={item.url}
                                        alt={item.name}
                                        width={thumbWidth * 2}
                                        height={thumbHeight * 2}
                                        style="image-rendering:pixelated;width:100%;height:100%;object-fit:cover"
                                        referrerpolicy="no-referrer"
                                    />
                                )}
                            </div>
                            <div class="text-center">
                                <div class="text-sm font-bold text-white group-hover:text-brand-200">
                                    {isBusy ? t.uploading : item.name}
                                </div>
                                {item.caption && (
                                    <div class="text-[10px] text-gray-400 leading-tight">{item.caption}</div>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
            {error && <p class="text-xs text-rose-400 text-center">{error}</p>}
        </div>
    )
}
