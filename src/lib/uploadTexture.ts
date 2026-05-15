// Posts a texture to the skin-upload Edge Function. The function
// validates the user's JWT, checks dimensions, hashes, uploads via
// service_role, and updates the user's skins-row column atomically.
//
// We route through the function instead of writing to storage directly
// because the project's storage gateway can't validate ES256-signed
// JWTs in its current build, which makes per-user RLS uploads fail.
// Once storage catches up we can revert to direct uploads — the only
// caller-visible difference is that the row update happens here too.
import type { SupabaseClient } from '@supabase/supabase-js'

export type TextureKind = 'skin' | 'cape' | 'elytra'

function bytesToBase64(bytes: Uint8Array): string {
    // btoa is fine for the sizes we deal with (max 1 MB per cap on the
    // server). Going through a binary string in chunks avoids busting
    // the JS argument-count limit on large arrays.
    let out = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
        out += String.fromCharCode(...bytes.subarray(i, i + chunk))
    }
    return btoa(out)
}

/** Thrown when the skin-upload function returns a non-2xx response.
 *  `code` is the machine-readable error string from the function
 *  (e.g. `cape_locked`, `hd_skin_locked`, `invalid_dimensions`).
 *  Callers should branch on `code` rather than parsing the message. */
export class UploadError extends Error {
    code: string
    status: number
    constructor(code: string, status: number, message?: string) {
        super(message || code)
        this.code = code
        this.status = status
        this.name = 'UploadError'
    }
}

export async function uploadTexture(
    sb: SupabaseClient,
    kind: TextureKind,
    bytes: Uint8Array,
    opts: { slim?: boolean } = {},
): Promise<string> {
    const { data: { session } } = await sb.auth.getSession()
    if (!session) throw new UploadError('not_signed_in', 401)

    const supabaseUrl = (sb as any).supabaseUrl as string
    const supabaseKey = (sb as any).supabaseKey as string

    const r = await fetch(`${supabaseUrl}/functions/v1/skin-upload`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseKey,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            kind,
            slim: opts.slim,
            content_b64: bytesToBase64(bytes),
        }),
    })
    if (!r.ok) {
        let code = `http_${r.status}`
        let message: string | undefined
        try {
            const body = await r.json()
            if (body?.error) code = String(body.error)
            if (body?.message) message = String(body.message)
        } catch { /* non-JSON body — keep generic code */ }
        throw new UploadError(code, r.status, message)
    }
    const { sha } = await r.json() as { sha: string }
    return sha
}
