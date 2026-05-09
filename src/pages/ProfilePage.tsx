import { useEffect, useState } from 'preact/hooks'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { T } from '../locales'

interface Props {
    sb: SupabaseClient
    user: User
    t: T
    nick: string | null
}

// Read-only summary of profile + the slim-model toggle, which is the only
// account-level setting we expose here. Skin/cape uploads live on their
// own pages because each one needs its own preview + uploader.
export function ProfilePage({ sb, user, t, nick }: Props) {
    const [slim, setSlim] = useState<boolean | null>(null)
    const [busy, setBusy] = useState(false)
    const [savedFlash, setSavedFlash] = useState(false)

    useEffect(() => {
        sb.from('skins').select('slim_model').eq('user_id', user.id).maybeSingle()
            .then(({ data }) => setSlim(data?.slim_model ?? false))
    }, [sb, user.id])

    async function toggleSlim() {
        if (slim === null) return
        setBusy(true)
        const next = !slim
        // Update first, optimistic. Roll back on error.
        setSlim(next)
        const { error } = await sb.from('skins').update({ slim_model: next, updated_at: new Date().toISOString() }).eq('user_id', user.id)
        setBusy(false)
        if (error) {
            setSlim(!next)
        } else {
            setSavedFlash(true)
            setTimeout(() => setSavedFlash(false), 1500)
        }
    }

    return (
        <div class="space-y-5">
            <h2 class="text-lg font-bold text-white">{t.profileTitle}</h2>

            <Field label={t.profileNick} hint={t.profileNickHint}>
                <code class="block px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/25 font-mono text-brand-200">
                    {nick ?? '—'}
                </code>
            </Field>

            <Field label={t.profileEmail}>
                <code class="block px-3 py-2 rounded-lg bg-brand-500/10 border border-brand-500/25 font-mono text-gray-200 text-sm">
                    {user.email ?? '—'}
                </code>
            </Field>

            <div class="pt-2 border-t border-brand-500/15">
                <label class="flex items-start gap-3 cursor-pointer group">
                    <span class="relative inline-flex flex-shrink-0 mt-0.5">
                        <input
                            type="checkbox"
                            disabled={slim === null || busy}
                            checked={!!slim}
                            onChange={toggleSlim}
                            class="sr-only peer"
                        />
                        <span class="w-10 h-6 rounded-full bg-brand-500/15 border border-brand-500/30 peer-checked:bg-brand-500/45 transition" />
                        <span class="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow transition peer-checked:translate-x-4" />
                    </span>
                    <span>
                        <span class="block text-sm font-semibold text-white">{t.profileSlimToggle}</span>
                        <span class="block text-xs text-gray-400 mt-0.5">{t.profileSlimHint}</span>
                    </span>
                </label>
                {savedFlash && <p class="text-xs text-emerald-400 mt-2">{t.profileSaved}</p>}
            </div>
        </div>
    )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: any }) {
    return (
        <div>
            <div class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{label}</div>
            {children}
            {hint && <p class="text-[11px] text-gray-500 mt-1.5">{hint}</p>}
        </div>
    )
}
