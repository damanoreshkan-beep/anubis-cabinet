# anubis-cabinet

Account cabinet web component for **Anubis World**. Lets a signed-in user manage their Minecraft profile (skin, cape, model, password) from any host page that embeds it — the launcher's settings panel, the website, anywhere.

Sister to [`anubis-auth-widget`](https://github.com/damanoreshkan-beep/anubis-auth-widget): same design system, same Supabase project, separate concern.

## Embed

```html
<script type="module" src="https://damanoreshkan-beep.github.io/anubis-cabinet/anubis-cabinet.js"></script>

<anubis-cabinet
  supabase-url="https://ckfinpywlpllvhvzagnw.supabase.co"
  supabase-key="sb_publishable_…"
  lang="uk"
  mode="web"
></anubis-cabinet>
```

Attributes:

| | |
|---|---|
| `supabase-url` | Project URL of the Supabase instance backing the auth widget |
| `supabase-key` | Publishable (anon) key |
| `lang` | `en` · `ru` · `uk` · `de` · `pl` (defaults to `en`) |
| `mode` | `web` (default) renders a sign-out button. `launcher` skips it — the desktop app handles auth itself. |

## What it does

* **Profile** — read-only Minecraft nick + email, slim-model toggle for the skin renderer.
* **Skin** — drag-and-drop PNG upload (64×64 / 128×128 HD), client-side SHA-256, stored in Supabase Storage, live 3D preview via [skinview3d](https://github.com/bs-community/skinview3d).
* **Cape** — same uploader for the 64×32 / 128×64 cape texture.
* **Password** — change Supabase Auth password.

The textures are content-addressed — saving a new skin uploads `<sha>.png` and updates the `skins` row to point at the new SHA. The companion `skin-api` Edge Function on Supabase serves these to the in-game [CustomSkinLoader](https://github.com/xfl03/MCCustomSkinLoader) mod over the standard CustomSkinAPI protocol.

## Architecture

```
   anubis-cabinet (web component)               Supabase                       Game client
   ──────────────────────────────               ────────                       ────────────
   1. user picks PNG
   2. validate (size, magic bytes)
   3. SHA-256 of bytes (crypto.subtle)
   4. upload  ──→  Storage: textures/<user_id>/<sha>.png (RLS: owner only)
   5. UPDATE  ──→  skins.skin_sha = <sha>
                                                                           
                                              skin-api Edge Function
                                              ──────────────────────
                                              GET /<nick>.json   ──→  CustomSkinLoader mod
                                                                       (every game start)
                                              GET /textures/<sha>──→  PNG bytes
                                                                      (cached on client)
```

## Build from source

Requires Node 22.

```bash
git clone https://github.com/damanoreshkan-beep/anubis-cabinet.git
cd anubis-cabinet
npm ci
npm run dev          # vite dev server with auto-mounted <anubis-cabinet>
npm run build        # → dist/anubis-cabinet.js (single ES module, CSS inlined)
```

A push to `main` triggers `.github/workflows/deploy.yml` which republishes the bundle to GitHub Pages.

## CSS isolation

Same scoping pattern as `anubis-auth-widget`. Tailwind's `important: '.aw-cabinet-scope'` config wraps every utility selector with that ancestor. Custom CSS rules in `src/widget.css` are written with the prefix manually. The post-build script in `scripts/scope-tailwind-globals.js` rewrites Tailwind's `*, :before, :after` and `::backdrop` resets so they don't reset host-page CSS variables.

## Locales

5 locales live as a single `COPY` object in `src/locales.ts`. Adding a key requires updating every locale at once.
