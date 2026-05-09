// 3D preview powered by skinview3d (Three.js wrapper that knows the
// Minecraft player model layout). Drag rotates, scroll zooms.
//
// The skin URL points at our Edge Function's content-addressed
// /textures/<sha> endpoint — same one the in-game CustomSkinLoader mod
// hits — so the preview is byte-identical to what players will see.
import { useEffect, useRef } from 'preact/hooks'
import { SkinViewer, WalkingAnimation, IdleAnimation } from 'skinview3d'

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
            // Steve placeholder — replaced on first prop change.
            skin: 'https://textures.minecraft.net/texture/cd9dec23da8f49a3aa61c7f1eda0e7a3c04ae2ded918bf486f02c9bf6cc4e44a',
            model: slim ? 'slim' : 'default',
            background: 0x040309,
        })
        v.controls.enableZoom = true
        v.controls.enableRotate = true
        v.controls.enablePan = false
        v.zoom = 0.85
        viewerRef.current = v

        return () => {
            v.dispose()
            viewerRef.current = null
        }
    }, [])

    // Update skin / cape / model on prop changes.
    useEffect(() => {
        const v = viewerRef.current
        if (!v) return
        if (skinUrl) {
            v.loadSkin(skinUrl, { model: slim ? 'slim' : 'default' }).catch(() => { /* ignore */ })
        } else {
            v.loadSkin(null)
        }
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
