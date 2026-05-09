import { useState } from 'preact/hooks'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { T } from '../locales'

interface Props {
    sb: SupabaseClient
    t: T
}

// Update password through Supabase Auth — `updateUser({ password })`.
// We don't ask for the *current* password because Supabase doesn't offer
// a re-authentication step here; the existing session is already proof
// of identity. Adding a current-password field would make us re-implement
// what `auth.signInWithPassword` already does, but with no extra security.
export function PasswordPage({ sb, t }: Props) {
    const [pwd1, setPwd1] = useState('')
    const [pwd2, setPwd2] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [done, setDone] = useState(false)

    async function submit(e: Event) {
        e.preventDefault()
        setError(''); setDone(false)
        if (pwd1.length < 6) { setError(t.passwordWeak); return }
        if (pwd1 !== pwd2)   { setError(t.passwordMismatch); return }
        setBusy(true)
        const { error: err } = await sb.auth.updateUser({ password: pwd1 })
        setBusy(false)
        if (err) { setError(err.message); return }
        setPwd1(''); setPwd2('')
        setDone(true)
        setTimeout(() => setDone(false), 2500)
    }

    const inputCls = 'w-full px-4 py-3 bg-brand-500/10 border border-brand-500/30 rounded-xl text-white placeholder-gray-500 focus:border-brand-400 focus:bg-brand-500/15 focus:outline-none transition'

    return (
        <form onSubmit={submit} class="space-y-4 max-w-sm">
            <h2 class="text-lg font-bold text-white">{t.passwordTitle}</h2>

            <label class="block">
                <span class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 block">{t.passwordNew}</span>
                <input type="password" required minLength={6} autoComplete="new-password" value={pwd1}
                    onInput={(e) => setPwd1((e.target as HTMLInputElement).value)} class={inputCls} placeholder="6+" />
            </label>
            <label class="block">
                <span class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 block">{t.passwordConfirm}</span>
                <input type="password" required minLength={6} autoComplete="new-password" value={pwd2}
                    onInput={(e) => setPwd2((e.target as HTMLInputElement).value)} class={inputCls} placeholder="6+" />
            </label>

            {error && <p class="text-xs text-rose-400">{error}</p>}
            {done && <p class="text-xs text-emerald-400">{t.passwordChanged}</p>}

            <button
                type="submit"
                disabled={busy}
                class="btn-glow w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-brand-600/30 disabled:opacity-50 disabled:pointer-events-none"
            >
                {busy ? t.saving : t.passwordSubmit}
            </button>
        </form>
    )
}
