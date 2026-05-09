// Curated preset library — pulled from Mojang's public textures CDN at
// click-time rather than redistributed in this repo. The CDN URL is
// stable for these well-known textures (used by every Minecraft skin
// viewer in the wild).
//
// Adding a preset = drop a new {name, url, model?} entry. The cabinet
// fetches the URL, hashes the bytes, uploads them into the user's own
// storage folder, and points their skins row at the new SHA.

export interface SkinPreset {
    name: string
    url: string
    /** Skin model: 'default' (Steve, square arms) or 'slim' (Alex, narrow arms) */
    model: 'default' | 'slim'
    /** Short caption shown under the preview card */
    caption?: string
}

export interface CapePreset {
    name: string
    url: string
    caption?: string
}

// Mojang default-skin family. These are publicly served by
// textures.minecraft.net and ship with every vanilla launcher.
export const SKIN_PRESETS: SkinPreset[] = [
    {
        name: 'Steve',
        model: 'default',
        url:  'https://textures.minecraft.net/texture/31f477eb1a7beee631c2ca64d06f8f68fa93a3386d04452ab27f43acdf1b60cb',
        caption: 'Classic',
    },
    {
        name: 'Alex',
        model: 'slim',
        url:  'https://textures.minecraft.net/texture/3b60a1f6d562f52aaebbf1434f1de147933a3affe0e764fa49ea057536623cd3',
        caption: 'Slim model',
    },
    {
        name: 'Zuri',
        model: 'default',
        url:  'https://textures.minecraft.net/texture/f5dddb41dcafef616e959c2817808e0be741c89ffbfed39134a13e75b811863d',
        caption: 'Default',
    },
]

// Public Mojang event capes — same CDN, same caveat: stable URLs, no
// redistribution by us.
export const CAPE_PRESETS: CapePreset[] = [
    {
        name: 'Migrator',
        url:  'https://textures.minecraft.net/texture/2340c0e03dd24a11b15a8b33c2a7e9e32abb2051b2481d0ba7defd635ca7a933',
        caption: 'Mojang account migration',
    },
    {
        name: 'MineCon 2011',
        url:  'https://textures.minecraft.net/texture/953cac8b779fe41383e675ee2b86071a71658f2180f56fbce8aa315ea70e2ed6',
        caption: 'Convention attendee',
    },
    {
        name: 'MineCon 2016',
        url:  'https://textures.minecraft.net/texture/9e507afc56359978a3eb3e32367042b853cddd0995d17d0da995662913fb00f7',
        caption: 'Convention attendee',
    },
]

// External resources to point users at when they want more variety than
// our preset shelf — these all serve community-uploaded content under
// their own terms, so we link rather than redistribute.
export const SKIN_LINKS = [
    { name: 'NameMC',                url: 'https://namemc.com/skins',       hint: 'Search any player\'s skin by nick' },
    { name: 'minecraftskins.com',    url: 'https://www.minecraftskins.com', hint: '600k+ community skins' },
    { name: 'Planet Minecraft',      url: 'https://www.planetminecraft.com/skins/', hint: 'Curated community uploads' },
    { name: 'NovaSkin Editor',       url: 'https://minecraft.novaskin.me',  hint: 'Edit your own in-browser' },
] as const
