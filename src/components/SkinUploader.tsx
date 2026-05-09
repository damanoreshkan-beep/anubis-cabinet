// File picker + drag-drop + client-side validation + upload via the
// skin-upload Edge Function. The function does the authoritative
// PNG/dimension check and SHA-256 hashing server-side; the client-side
// dimension check below is purely UX (instant feedback before the
// round-trip).
//
// We read width/height from the PNG IHDR header directly instead of
// loading the bytes into an Image element. URL.createObjectURL is
// missing in Electron renderers with nodeIntegration enabled (Node's
// URL shadows the Web URL), and decoding via Image would otherwise
// silently throw before we even attempt to upload.
import { useRef, useState, useCallback } from 'preact/hooks'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { T } from '../locales'
import { uploadTexture, TextureKind } from '../lib/uploadTexture'

export interface PngDimensions { w: number; h: number }
export type Validator = (dims: PngDimensions) => boolean

// PNG signature is the first 8 bytes; the IHDR chunk starts at byte 8
// and stores width and height as big-endian uint32s at offsets 16/20.
const PNG_SIG = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
function readPngDimensions(buf: ArrayBuffer): PngDimensions | null {
    const bytes = new Uint8Array(buf)
    if (bytes.length < 24) return null
    for (let i = 0; i < 8; i++) if (bytes[i] !== PNG_SIG[i]) return null
    const dv = new DataView(buf)
    return { w: dv.getUint32(16), h: dv.getUint32(20) }
}

interface Props {
    sb: SupabaseClient
    user: User
    t: T
    /** Which slot we're writing to. */
    kind: TextureKind
    /** Skin only: tells the server which model column value to persist. */
    slim?: boolean
    accept: string
    validateImage: Validator
    /** Fires after a successful upload — caller refreshes its read of `skins`. */
    onUploaded: (sha: string) => Promise<void> | void
    hint?: string
    label: string
}

export function SkinUploader({ sb, user: _user, t, kind, slim, accept, validateImage, onUploaded, hint, label }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [dragActive, setDragActive] = useState(false)

    const handleFile = useCallback(async (file: File) => {
        setError('')
        if (file.type !== 'image/png') { setError(t.errInvalidPng); return }
        if (file.size > 1024 * 1024)   { setError(t.errTooLarge);   return }
        const buf = await file.arrayBuffer()
        const dims = readPngDimensions(buf)
        if (!dims)                  { setError(t.errInvalidPng);  return }
        if (!validateImage(dims))   { setError(t.errInvalidSize); return }

        setBusy(true)
        try {
            const sha = await uploadTexture(sb, kind, new Uint8Array(buf), { slim })
            await onUploaded(sha)
        } catch (e: any) {
            setError(`${t.errUploadFailed} ${e?.message ?? String(e)}`)
        } finally {
            setBusy(false)
        }
    }, [sb, t, kind, slim, validateImage, onUploaded])

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
