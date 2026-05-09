// 2D front-view composite of a Minecraft skin texture. Used by the
// preset shelf so each card shows a recognisable little character
// instead of the raw 64×64 atlas (which looks like garbage to anyone
// who isn't a texture artist).
//
// We draw the head, body, both arms and both legs of the FRONT face
// only, then layer the second-layer overlay (hat, jacket, sleeves,
// pants) on top. No 3D, no animation, no Three.js — just one
// drawImage chain per skin, ~30 µs of work per card. That's why we
// pick this over spinning up extra SkinViewers per card.
import { useEffect, useRef } from 'preact/hooks'

interface Props {
    url: string
    /** Slim (Alex) arms are 3 px wide on the texture instead of 4. */
    slim?: boolean
    /** CSS-pixel dimensions; the canvas itself is fixed 16×32 native. */
    width?: number
    height?: number
}

// Native canvas size — width 16, height 32 — chosen so the four parts
// (right arm | body | left arm) on the wide row line up exactly with
// the 8-wide head and 8-wide body. Heights stack: 8 head + 12 torso/
// arms + 12 legs = 32.
const W = 16
const H = 32

export function SkinThumbnail2D({ url, slim = false, width = 64, height = 128 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const cv = canvasRef.current
        if (!cv) return
        cv.width = W
        cv.height = H
        const ctx = cv.getContext('2d')
        if (!ctx) return
        // Pixel-art look — disable the browser's bicubic smoothing so
        // 1 source pixel maps to 1 destination pixel cleanly.
        ctx.imageSmoothingEnabled = false

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            ctx.clearRect(0, 0, W, H)

            // Skin atlas coordinates are well-known and match the
            // canonical Minecraft layout (search "minecraft skin
            // template 64×64" for the standard reference image).
            const armW = slim ? 3 : 4
            // For both arm widths we keep the body centred on x=4..11
            // and tuck the arms against it: right at (4-armW)..3, left
            // at 12..(11+armW).
            const rArmX = 4 - armW
            const lArmX = 12

            // Base layer.
            ctx.drawImage(img,  8,  8, 8, 8, 4,  0, 8, 8)   // head front
            ctx.drawImage(img, 20, 20, 8, 12, 4,  8, 8, 12) // torso front
            ctx.drawImage(img, 44, 20, armW, 12, rArmX, 8, armW, 12) // right arm front
            ctx.drawImage(img,  4, 20, 4, 12, 4, 20, 4, 12) // right leg front
            // Left arm + leg live in the bottom-right of 64×64 atlases.
            // 64×32 legacy skins didn't have these — the renderer is
            // expected to mirror the right side. Detect by atlas
            // height and mirror when needed.
            const isLegacy = img.naturalHeight === 32
            if (isLegacy) {
                // Mirror the right arm/leg horizontally for the left
                // side (sx = atlas right side, dx = mirrored). Easiest
                // way: scale(-1, 1) translate, then draw.
                ctx.save()
                ctx.translate(lArmX + armW, 8)
                ctx.scale(-1, 1)
                ctx.drawImage(img, 44, 20, armW, 12, 0, 0, armW, 12)
                ctx.restore()
                ctx.save()
                ctx.translate(8 + 4, 20)
                ctx.scale(-1, 1)
                ctx.drawImage(img, 4, 20, 4, 12, 0, 0, 4, 12)
                ctx.restore()
            } else {
                ctx.drawImage(img, 36, 52, armW, 12, lArmX, 8, armW, 12)
                ctx.drawImage(img, 20, 52, 4, 12, 8, 20, 4, 12)
            }

            // Overlay (second) layer — hat, jacket, sleeves, pants.
            // Only present on 64×64 atlases; skip cleanly on legacy.
            if (!isLegacy) {
                ctx.drawImage(img, 40,  8, 8, 8, 4,  0, 8, 8)        // hat
                ctx.drawImage(img, 20, 36, 8, 12, 4,  8, 8, 12)      // jacket
                ctx.drawImage(img, 44, 36, armW, 12, rArmX, 8, armW, 12) // right sleeve
                ctx.drawImage(img, 52, 52, armW, 12, lArmX, 8, armW, 12) // left sleeve
                ctx.drawImage(img,  4, 36, 4, 12, 4, 20, 4, 12)      // right pant
                ctx.drawImage(img,  4, 52, 4, 12, 8, 20, 4, 12)      // left pant
            }
        }
        img.onerror = () => { /* leave the canvas blank — caller decides what to show */ }
        img.src = url
    }, [url, slim])

    return (
        <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={`width:${width}px;height:${height}px;image-rendering:pixelated;display:block`}
        />
    )
}
