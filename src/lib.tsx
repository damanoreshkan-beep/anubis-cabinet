import register from 'preact-custom-element'
import { CabinetWidget } from './CabinetWidget'
import css from './widget.css?inline'

// Inject CSS once into document.head — same pattern as anubis-auth-widget,
// no Shadow DOM (skinview3d's Three.js mixes badly with shadow root style
// boundaries, and our consumers already use Tailwind globally).
const STYLE_ID = 'anubis-cabinet-styles'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const el = document.createElement('style')
    el.id = STYLE_ID
    el.textContent = css
    document.head.appendChild(el)
}

register(
    CabinetWidget as any,
    'anubis-cabinet',
    ['supabase-url', 'supabase-key', 'lang', 'mode'],
    { shadow: false },
)
