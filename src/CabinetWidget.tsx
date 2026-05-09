import { useEffect, useState, useRef, useMemo } from 'preact/hooks'
import { createClient, type SupabaseClient, type Session, type User } from '@supabase/supabase-js'
import { copyFor, type T } from './locales'
import { ProfilePage } from './pages/ProfilePage'
import { SkinPage } from './pages/SkinPage'
import { CapePage } from './pages/CapePage'
import { PasswordPage } from './pages/PasswordPage'

interface Props {
    supabaseUrl?: string
    supabaseKey?: string
    lang?: string
    /** `web` (default) — full layout. `launcher` — embedded inline, no signOut button (the launcher manages auth). */
    mode?: 'web' | 'launcher'
}

type Page = 'profile' | 'skin' | 'cape' | 'password'

export function CabinetWidget({ supabaseUrl, supabaseKey, lang, mode }: Props) {
    const t = copyFor(lang)
    const inLauncher = mode === 'launcher'

    const sbRef = useRef<SupabaseClient | null>(null)
    if (!sbRef.current && supabaseUrl && supabaseKey) {
        sbRef.current = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        })
    }
    const sb = sbRef.current

    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState<Page>('profile')

    useEffect(() => {
        if (!sb) { setLoading(false); return }
        sb.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
        const { data: sub } = sb.auth.onAuthStateChange((_event, sess) => setSession(sess))
        return () => sub.subscription.unsubscribe()
    }, [sb])

    if (!sb) {
        return <div class="aw-cabinet-scope p-4 text-sm text-rose-400">missing supabase-url / supabase-key</div>
    }

    if (loading) {
        return (
            <div class="aw-cabinet-scope flex items-center justify-center p-12 text-gray-400">
                <div class="w-6 h-6 rounded-full border-2 border-brand-500/30 border-t-brand-400 animate-spin" />
            </div>
        )
    }

    if (!session?.user) {
        return (
            <div class="aw-cabinet-scope p-8 text-center text-gray-400 text-sm">
                {t.errSignInRequired}
            </div>
        )
    }

    return (
        <div class="aw-cabinet-scope">
            <CabinetShell
                sb={sb}
                user={session.user}
                t={t}
                page={page}
                onPage={setPage}
                inLauncher={inLauncher}
                onSignOut={async () => { await sb.auth.signOut() }}
            />
        </div>
    )
}

function CabinetShell({
    sb, user, t, page, onPage, inLauncher, onSignOut,
}: {
    sb: SupabaseClient
    user: User
    t: T
    page: Page
    onPage: (p: Page) => void
    inLauncher: boolean
    onSignOut: () => void
}) {
    const [nick, setNick] = useState<string | null>(null)
    useEffect(() => {
        sb.from('profiles').select('minecraft_nick').eq('id', user.id).maybeSingle()
            .then(({ data }) => setNick(data?.minecraft_nick ?? null))
    }, [sb, user.id])

    const navItems: { id: Page; label: string; icon: any }[] = useMemo(() => [
        { id: 'profile',  label: t.navProfile,  icon: <UserIcon /> },
        { id: 'skin',     label: t.navSkin,     icon: <ShirtIcon /> },
        { id: 'cape',     label: t.navCape,     icon: <CapeIcon /> },
        { id: 'password', label: t.navPassword, icon: <LockIcon /> },
    ], [t])

    return (
        <div class="w-full mx-auto max-w-5xl text-gray-100">
            <header class="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                    <h1 class="text-2xl font-bold tracking-tight">
                        <span class="gold-text">{t.title}</span>
                    </h1>
                    <p class="text-xs text-gray-400 mt-1">
                        {t.signedInAs}{' '}
                        <span class="font-mono text-brand-300">
                            {nick ?? user.email}
                        </span>
                    </p>
                </div>
                {!inLauncher && (
                    <button
                        type="button"
                        onClick={onSignOut}
                        class="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-500/10 hover:bg-rose-500/15 border border-brand-500/30 hover:border-rose-500/45 text-gray-300 hover:text-rose-200 transition"
                    >
                        {t.signOut}
                    </button>
                )}
            </header>

            <div class="grid gap-4 md:grid-cols-[200px_1fr]">
                <aside class="glass rounded-2xl p-2 self-start">
                    {navItems.map(item => {
                        const active = page === item.id
                        return (
                            <button
                                type="button"
                                onClick={() => onPage(item.id)}
                                class={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                                    active
                                        ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/30'
                                        : 'text-gray-300 hover:text-white hover:bg-brand-500/10'
                                }`}
                            >
                                <span class={active ? 'text-white' : 'text-brand-300'}>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        )
                    })}
                </aside>

                <main class="glass rounded-2xl p-5 md:p-7 min-h-[420px]">
                    {page === 'profile'  && <ProfilePage  sb={sb} user={user} t={t} nick={nick} />}
                    {page === 'skin'     && <SkinPage     sb={sb} user={user} t={t} nick={nick} />}
                    {page === 'cape'     && <CapePage     sb={sb} user={user} t={t} />}
                    {page === 'password' && <PasswordPage sb={sb}              t={t} />}
                </main>
            </div>
        </div>
    )
}

const UserIcon = () => (
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
)
const ShirtIcon = () => (
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16 3l-4 4-4-4M5 6l3-3h8l3 3v4l-3 1v10H8V11L5 10V6z" />
    </svg>
)
const CapeIcon = () => (
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h12l2 6-3 11H7L4 10z" />
    </svg>
)
const LockIcon = () => (
    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m0 4a9 9 0 110-18 9 9 0 010 18zM7.5 11V7a4.5 4.5 0 119 0v4" />
    </svg>
)
