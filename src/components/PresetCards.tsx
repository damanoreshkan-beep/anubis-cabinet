// Preset shelf for the skin / cape pages. Clicking a card runs the same
// upload-and-persist flow as picking a file: fetch the preset PNG from
// its CDN URL, compute SHA-256 of the bytes, upload into the user's
// storage folder, then call the page-supplied onApplied(sha) so the
// page can update the right skins-row column.
import { useState } from 'preact/hooks'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { T } from '../locales'

export interface PresetItem {
    name: string
    url: string
    /** Optional secondary line under the name on the card. */
    caption?: string
    /** Skin only: which model the preset is drawn for. */
    model?: 'default' | 'slim'
}

interface Props {
    sb: SupabaseClient
    user: User
    t: T
    items: PresetItem[]
    /** Pixel size to render the preview thumbnail at. Skin presets are
     *  square 64×64; capes are 64×32 so callers pass a wider aspect. */
    thumbWidth?: number
    thumbHeight?: number
    onApplied: (item: PresetItem, sha: string) => Promise<void> | void
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

export function PresetCards({ sb, user, t, items, thumbWidth = 64, thumbHeight = 64, onApplied }: Props) {
    const [busy, setBusy] = useState<string | null>(null)
    const [error, setError] = useState('')

    async function apply(item: PresetItem) {
        setError('')
        setBusy(item.name)
        try {
            const r = await fetch(item.url)
            if (!r.ok) throw new Error(`fetch ${r.status}`)
            const buf = await r.arrayBuffer()
            const sha = await sha256Hex(buf)
            const path = `${user.id}/${sha}.png`
            const { error: upErr } = await sb.storage.from('textures').upload(path, new Blob([buf], { type: 'image/png' }), {
                contentType: 'image/png',
                upsert: true,
                cacheControl: '31536000, immutable',
            })
            if (upErr) throw upErr
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
                                class="rounded-lg overflow-hidden border border-brand-500/20"
                                style={`width:${thumbWidth * 2}px;height:${thumbHeight * 2}px;background:#0d0a1c;image-rendering:pixelated`}
                            >
                                {/* Preview is just the raw texture — works as a quick visual identifier even though it's not a 3D render */}
                                <img
                                    src={item.url}
                                    alt={item.name}
                                    width={thumbWidth * 2}
                                    height={thumbHeight * 2}
                                    style="image-rendering:pixelated;width:100%;height:100%;object-fit:cover"
                                    referrerpolicy="no-referrer"
                                />
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
