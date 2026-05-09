// File picker + drag-drop + client-side validation + SHA-256 hashing +
// upload to Supabase Storage. Used by both SkinPage and CapePage — they
// pass different `validate` callbacks because skins and capes have
// different valid pixel dimensions.
import { useRef, useState, useCallback } from 'preact/hooks'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { T } from '../locales'

export type Validator = (img: HTMLImageElement) => boolean

interface Props {
    sb: SupabaseClient
    user: User
    t: T
    accept: string                   // file picker filter (e.g. 'image/png')
    validateImage: Validator         // checks pixel dimensions
    /** Called with the SHA after a successful upload. Caller persists it
     *  to the right column on `skins` (skin_sha / cape_sha / elytra_sha). */
    onUploaded: (sha: string) => Promise<void> | void
    /** Optional custom hint copy shown under the dropzone. */
    hint?: string
    /** Label shown on the trigger button. */
    label: string
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(digest))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

export function SkinUploader({ sb, user, t, accept, validateImage, onUploaded, hint, label }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [dragActive, setDragActive] = useState(false)

    const handleFile = useCallback(async (file: File) => {
        setError('')
        if (file.type !== 'image/png') { setError(t.errInvalidPng); return }
        if (file.size > 1024 * 1024)   { setError(t.errTooLarge);   return }
        const buf = await file.arrayBuffer()
        const blobUrl = URL.createObjectURL(new Blob([buf], { type: 'image/png' }))
        const img = new Image()
        await new Promise<void>((res, rej) => {
            img.onload = () => res()
            img.onerror = () => rej(new Error('decode'))
            img.src = blobUrl
        }).catch(() => { setError(t.errInvalidPng) })
        if (error) { URL.revokeObjectURL(blobUrl); return }
        if (!validateImage(img)) {
            URL.revokeObjectURL(blobUrl)
            setError(t.errInvalidSize)
            return
        }
        URL.revokeObjectURL(blobUrl)

        setBusy(true)
        try {
            const sha = await sha256Hex(buf)
            const path = `${user.id}/${sha}.png`
            // upsert: same SHA = same content, no need to re-upload but
            // also harmless if we do. `upsert: true` makes re-uploading
            // an identical skin a no-op rather than a 409 conflict.
            const { error: upErr } = await sb.storage.from('textures').upload(path, file, {
                contentType: 'image/png',
                upsert: true,
                cacheControl: '31536000, immutable',
            })
            if (upErr) { setError(`${t.errUploadFailed} ${upErr.message}`); return }
            await onUploaded(sha)
        } catch (e: any) {
            setError(`${t.errUploadFailed} ${e?.message ?? String(e)}`)
        } finally {
            setBusy(false)
        }
    }, [sb, user.id, t, validateImage, onUploaded])

    const onDrop = useCallback((e: DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const f = e.dataTransfer?.files?.[0]
        if (f) handleFile(f)
    }, [handleFile])

    const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setDragActive(true) }, [])
    const onDragLeave = useCallback(() => setDragActive(false), [])

    return (
        <div class="space-y-2">
            <div
                class={`dropzone flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-2xl border-2 border-dashed border-brand-500/30 bg-brand-500/5 hover:bg-brand-500/8 cursor-pointer transition ${dragActive ? 'is-active' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    style="display:none"
                    onChange={e => {
                        const f = (e.target as HTMLInputElement).files?.[0]
                        if (f) handleFile(f)
                        ;(e.target as HTMLInputElement).value = ''
                    }}
                />
                <svg class="w-8 h-8 text-brand-300" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.39-1.83A5.5 5.5 0 1118 16h-1m-6-4l3-3m0 0l3 3m-3-3v12" />
                </svg>
                <button
                    type="button"
                    disabled={busy}
                    class="btn-glow inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow-lg shadow-brand-600/30 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {busy ? t.uploading : label}
                </button>
                {hint && <p class="text-[11px] text-gray-500 text-center max-w-xs leading-relaxed">{hint}</p>}
            </div>
            {error && <p class="text-xs text-rose-400 text-center">{error}</p>}
        </div>
    )
}
