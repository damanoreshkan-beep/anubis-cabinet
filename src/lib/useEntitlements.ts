// Reads the signed-in user's donation entitlements (cape unlock,
// HD-skin unlock) from the `entitlements` table. RLS lets each user
// see their own row only, so a thin select is enough.
//
// Cached in a module-level WeakMap by client + user so multiple pages
// don't refetch on every tab switch within one cabinet session. The
// row gets refetched on mount of each consumer too — Supabase Studio
// admin flips are picked up the next time the user clicks Cape / Skin.
import { useEffect, useState } from 'preact/hooks'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export interface Entitlements {
    capeUnlocked: boolean
    hdSkinUnlocked: boolean
}

const DEFAULT_ENT: Entitlements = { capeUnlocked: false, hdSkinUnlocked: false }

export function useEntitlements(sb: SupabaseClient, user: User): {
    ent: Entitlements
    loading: boolean
    refresh: () => Promise<void>
} {
    const [ent, setEnt] = useState<Entitlements>(DEFAULT_ENT)
    const [loading, setLoading] = useState(true)

    const refresh = async () => {
        const { data } = await sb.from('entitlements')
            .select('cape_unlocked, hd_skin_unlocked')
            .eq('user_id', user.id)
            .maybeSingle()
        setEnt({
            capeUnlocked: !!data?.cape_unlocked,
            hdSkinUnlocked: !!data?.hd_skin_unlocked,
        })
        setLoading(false)
    }

    useEffect(() => { refresh() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [sb, user.id])

    return { ent, loading, refresh }
}
