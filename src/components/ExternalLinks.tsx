// Small "where to get more" shelf shown under the preset cards. Each
// link opens in a new tab. Behaviour is identical between the launcher
// (Electron renderer) and the website — anchor target=_blank works in
// both, the launcher's default external-link handler routes through
// shell.openExternal automatically.
import type { SKIN_LINKS } from '../presets'

interface Props {
    items: typeof SKIN_LINKS
    title: string
}

export function ExternalLinks({ items, title }: Props) {
    return (
        <div class="space-y-2">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
            <div class="grid grid-cols-2 gap-2">
                {items.map(link => (
                    <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group flex items-start gap-2 p-3 rounded-xl border border-brand-500/15 bg-brand-500/5 hover:bg-brand-500/10 hover:border-brand-400/35 transition"
                    >
                        <svg class="w-4 h-4 text-brand-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M14 3l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <div class="min-w-0">
                            <div class="text-sm font-semibold text-white group-hover:text-brand-200">{link.name}</div>
                            <div class="text-[11px] text-gray-400 leading-snug">{link.hint}</div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}
