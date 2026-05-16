/** @type {import('tailwindcss').Config} */
// Anubis World design system is the canonical source for palette,
// spacing, radius, typography, and keyframes. We extend the shared
// preset with widget-specific concerns only: scoping selector and the
// `preflight: false` toggle that keeps Tailwind's reset out of the
// host page.
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const anubisPreset = require('@anubis/ds/dist/tailwind-preset.cjs')

export default {
    presets: [anubisPreset],
    content: ['./src/**/*.{ts,tsx,html}', './index.html'],
    important: '.aw-cabinet-scope',
    corePlugins: {
        preflight: false,
    },
}
