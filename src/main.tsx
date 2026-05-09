// Dev entry — mount the cabinet directly so `npm run dev` shows it.
// Uses the same public Anubis World Supabase project as the live build;
// log in via the website widget once and the dev cabinet picks up your
// session through localStorage.
import { render } from 'preact'
import './lib'

const SUPABASE_URL = 'https://ckfinpywlpllvhvzagnw.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Bl6csDnCJ5LIJsIsCafMYQ_5zwLTgvR'

const el = document.createElement('anubis-cabinet')
el.setAttribute('supabase-url', SUPABASE_URL)
el.setAttribute('supabase-key', SUPABASE_KEY)
el.setAttribute('lang', 'uk')
document.body.style.padding = '32px'
document.body.appendChild(el)

// Tiny dev hint
const hint = document.createElement('div')
hint.style.cssText = 'position:fixed;bottom:8px;right:12px;color:#666;font-size:11px;font-family:monospace'
hint.textContent = 'dev — log in via partner site to see your real account'
document.body.appendChild(hint)

// Silence "render imported but unused" — ensures bundler keeps it.
void render
