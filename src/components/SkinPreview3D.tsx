// 3D preview powered by skinview3d (Three.js wrapper that knows the
// Minecraft player model layout). Drag rotates, scroll zooms.
//
// The skin URL points at our Edge Function's content-addressed
// /textures/<sha> endpoint — same one the in-game CustomSkinLoader mod
// hits — so the preview is byte-identical to what players will see.
import { useEffect, useRef } from 'preact/hooks'
import { SkinViewer, WalkingAnimation, IdleAnimation } from 'skinview3d'

// Universal Steve hash — the texture every Minecraft client falls back
// to when no custom skin is set. We use it as the placeholder so an
// empty profile still renders a recognisable model in the preview.
const FALLBACK_STEVE_URL =
    'https://textures.minecraft.net/texture/31f477eb1a7beee631c2ca64d06f8f68fa93a3386d04452ab27f43acdf1b60cb'

interface Props {
    skinUrl: string | null   // null → render Steve as fallback
    capeUrl?: string | null
    slim?: boolean
    width?: number
    height?: number
    /** Toggle a walking animation. Default idle (gentle sway). */
    walking?: boolean
}

export function SkinPreview3D({ skinUrl, capeUrl, slim = false, width = 280, height = 420, walking = false }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const viewerRef = useRef<SkinViewer | null>(null)

    // Initialise once. We mutate the existing viewer instead of disposing
    // and recreating on every prop change because skinview3d's WebGL
    // context is expensive to spin up.
    useEffect(() => {
        if (!canvasRef.current || viewerRef.current) return
        const v = new SkinViewer({
            canvas: canvasRef.current,
            width, height,
            skin: FALLBACK_STEVE_URL,
            model: slim ? 'slim' : 'default',
            background: 0x040309,
        })
        v.controls.enableZoom = true
        v.controls.enableRotate = true
        v.controls.enablePan = false
        v.zoom = 0.85

        // CPU mitigation. Three.js's default render loop runs every
        // requestAnimationFrame tick (≈60Hz) at devicePixelRatio (2-3 on
        // HiDPI), which is wasteful for a tiny preview pane.
        //
        //   1. Cap pixel ratio at 1 — quarters fragment-shader work on
        //      retina screens, the difference is barely visible at this
        //      preview size.
        //   2. Cap framerate to 30 — skinview3d 3.x exposes `fps` for
        //      this; halves the per-second draw count.
        v.renderer.setPixelRatio(1)
        ;(v as any).fps = 30
        viewerRef.current = v

        return () => {
            v.dispose()
            viewerRef.current = null
        }
    }, [])

    // Update skin / cape / model on prop changes. When skinUrl is null
    // we still want a model in the preview pane, so fall back to Steve
    // rather than blanking the canvas.
    useEffect(() => {
        const v = viewerRef.current
        if (!v) return
        const url = skinUrl || FALLBACK_STEVE_URL
        v.loadSkin(url, { model: slim ? 'slim' : 'default' }).catch(() => { /* ignore */ })
    }, [skinUrl, slim])

    useEffect(() => {
        const v = viewerRef.current
        if (!v) return
        if (capeUrl) v.loadCape(capeUrl).catch(() => { /* ignore */ })
        else v.loadCape(null)
    }, [capeUrl])

    useEffect(() => {
        const v = viewerRef.current
        if (!v) return
        v.animation = walking ? new WalkingAnimation() : new IdleAnimation()
    }, [walking])

    return (
        <div class="skin-preview-frame inline-block">
            <canvas ref={canvasRef} style={`display:block;width:${width}px;height:${height}px`} />
        </div>
    )
}
