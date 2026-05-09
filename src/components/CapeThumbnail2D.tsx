// 2D thumbnail of a cape texture — crops the "back face" (the side
// other players see when the wearer's facing away) out of the 64×32
// atlas and shows just that. The full atlas has lots of empty area
// that makes cards look broken; the back face alone is instantly
// recognisable as a cape.
import { useEffect, useRef } from 'preact/hooks'

interface Props {
    url: string
    width?: number
    height?: number
}

// Native crop is 10 wide × 16 tall — the canonical visible cape face.
// HD capes (128×64) double the atlas; we scale source coordinates by
// the actual texture width.
const W = 10
const H = 16

export function CapeThumbnail2D({ url, width = 80, height = 128 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const cv = canvasRef.current
        if (!cv) return
        cv.width = W
        cv.height = H
        const ctx = cv.getContext('2d')
        if (!ctx) return
        ctx.imageSmoothingEnabled = false

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            ctx.clearRect(0, 0, W, H)
            // Visible cape back face at x=11..21, y=1..17 in 64×32 atlas.
            // Scale source coords by atlas width so HD capes still crop
            // the right region.
            const s = img.naturalWidth / 64
            ctx.drawImage(img, 11 * s, 1 * s, 10 * s, 16 * s, 0, 0, W, H)
        }
        img.onerror = () => { /* leave blank */ }
        img.src = url
    }, [url])

    return (
        <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={`width:${width}px;height:${height}px;image-rendering:pixelated;display:block`}
        />
    )
}
