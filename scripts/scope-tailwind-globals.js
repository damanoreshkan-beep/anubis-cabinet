// Tailwind v3 emits two unscopeable globals into the compiled CSS that
// `important: '.aw-cabinet-scope'` doesn't touch:
//   1. `*, :before, :after { --tw-…: 0 … }` initialises every CSS custom
//      property the utilities rely on (--tw-shadow, --tw-blur, …).
//   2. `::backdrop { --tw-…: 0 … }` mirrors that for the ::backdrop pseudo.
// Both end up in document.head when the bundle injects its CSS, where
// they reset the host page's --tw-* state and silently flatten the host's
// shadows / transforms / blurs. We post-process the bundle to scope both
// rules so they only apply to widget descendants.
import { readFileSync, writeFileSync } from 'node:fs'

const FILE = 'dist/anubis-cabinet.js'
const original = readFileSync(FILE, 'utf8')

const replacements = [
    {
        pattern: /\*,:before,:after\{/g,
        replacement: '.aw-cabinet-scope,.aw-cabinet-scope :before,.aw-cabinet-scope :after{',
        label: '*, :before, :after',
    },
    {
        pattern: /::backdrop\{/g,
        replacement: '.aw-cabinet-scope ::backdrop{',
        label: '::backdrop',
    },
]

let patched = original
let totalHits = 0
for (const { pattern, replacement, label } of replacements) {
    const matches = patched.match(pattern)
    if (matches) {
        patched = patched.replace(pattern, replacement)
        totalHits += matches.length
        console.log(`  scoped ${matches.length}× ${label}`)
    } else {
        console.log(`  no match for ${label}`)
    }
}

if (totalHits === 0) {
    console.warn('No globals found to scope — Tailwind output may have changed format.')
    process.exit(0)
}

writeFileSync(FILE, patched)
console.log(`Patched ${FILE} (${totalHits} replacement${totalHits === 1 ? '' : 's'}).`)
