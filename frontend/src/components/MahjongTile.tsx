import React, { useEffect, useRef } from 'react'
import 'mahgen'
import { toMahgen } from '../utils/tiles'

interface MahjongTileProps {
  tile: string
  horizontal?: boolean
  faceDown?: boolean
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
  size?: 'sm' | 'md' | 'lg'
  highlight?: boolean
}

// Exact pixel dimensions matching mahgen's natural 70x100 and 92x77 aspect ratios
// Sized up for clear visibility across all screens
const TILE_DIMS = {
  sm: {
    portrait: { w: 30, h: 43 },
    horizontal: { w: 43, h: 36 },
  },
  md: {
    portrait: { w: 38, h: 54 },
    horizontal: { w: 52, h: 44 },
  },
  lg: {
    portrait: { w: 52, h: 74 },
    horizontal: { w: 70, h: 58 },
  },
}

export const MahjongTile: React.FC<MahjongTileProps> = ({
  tile,
  horizontal = false,
  faceDown = false,
  onClick,
  disabled = false,
  selected = false,
  size = 'md',
  highlight = false,
}) => {
  const mgRef = useRef<HTMLElement>(null)
  const dims = horizontal ? TILE_DIMS[size].horizontal : TILE_DIMS[size].portrait

  // Prepend '_' if horizontal for native mahgen rotated rendering
  const baseSeq = toMahgen(tile)
  const mahgenSeq = horizontal ? `_${baseSeq}` : baseSeq

  // Penetrate open shadowRoot to enforce exact pixel dimensions on the inner <img>
  useEffect(() => {
    if (faceDown) return

    let cancelled = false
    let retryCount = 0

    const applyInnerImgStyles = () => {
      if (cancelled) return
      const mg = mgRef.current
      if (!mg) return

      const img = mg.shadowRoot?.querySelector('img') as HTMLImageElement | null
      if (!img) {
        if (retryCount < 20) {
          retryCount++
          requestAnimationFrame(applyInnerImgStyles)
        }
        return
      }

      // Set explicit dimensions on host and inner image
      mg.style.width = `${dims.w}px`
      mg.style.height = `${dims.h}px`
      mg.style.display = 'inline-block'

      img.style.width = `${dims.w}px`
      img.style.height = `${dims.h}px`
      img.style.display = 'block'
      img.style.objectFit = 'contain'

      img.onload = () => {
        if (!cancelled) {
          img.style.width = `${dims.w}px`
          img.style.height = `${dims.h}px`
        }
      }
    }

    applyInnerImgStyles()

    return () => {
      cancelled = true
    }
  }, [mahgenSeq, dims.w, dims.h, faceDown])

  if (faceDown) {
    return (
      <div
        style={{ width: `${dims.w}px`, height: `${dims.h}px` }}
        className="inline-flex items-center justify-center rounded-xs border border-amber-950/80 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 shadow-sm shrink-0"
      >
        <div className="h-4/5 w-4/5 rounded-2xs border border-amber-500/20 bg-amber-900/60" />
      </div>
    )
  }

  return (
    <div
      style={{ width: `${dims.w}px`, height: `${dims.h}px` }}
      onClick={!disabled ? onClick : undefined}
      className={`relative inline-flex select-none items-center justify-center shrink-0 transition-transform duration-100 ${
        onClick && !disabled
          ? 'cursor-pointer hover:-translate-y-2 hover:drop-shadow-lg'
          : ''
      } ${selected ? '-translate-y-2 drop-shadow-xl' : ''} ${
        highlight ? 'ring-2 ring-emerald-400 rounded-xs' : ''
      } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
      <mah-gen
        ref={mgRef}
        data-seq={mahgenSeq}
        style={{ width: `${dims.w}px`, height: `${dims.h}px` }}
        className="pointer-events-none drop-shadow-sm"
      />
    </div>
  )
}
