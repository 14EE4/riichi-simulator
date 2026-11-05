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
  const containerRef = useRef<HTMLDivElement>(null)
  const mahgenSeq = toMahgen(tile)

  const sizeClasses = {
    sm: horizontal ? 'w-8 h-6' : 'w-6 h-8',
    md: horizontal ? 'w-11 h-8' : 'w-8 h-11',
    lg: horizontal ? 'w-14 h-10' : 'w-10 h-14',
  }

  if (faceDown) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-sm border border-amber-900/60 bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 shadow-md ${
          sizeClasses[size]
        } ${horizontal ? 'rotate-90' : ''}`}
      >
        <div className="h-4/5 w-4/5 rounded-xs border border-amber-500/30 bg-amber-900/50" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onClick={!disabled ? onClick : undefined}
      className={`relative inline-flex select-none items-center justify-center rounded-sm transition-all duration-150 ${
        sizeClasses[size]
      } ${
        onClick && !disabled
          ? 'cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:ring-2 hover:ring-amber-400'
          : ''
      } ${selected ? '-translate-y-2 ring-2 ring-amber-400 shadow-xl' : ''} ${
        highlight ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900 shadow-lg' : ''
      } ${disabled ? 'opacity-75 cursor-not-allowed' : ''} ${
        horizontal ? 'rotate-90 origin-center my-1' : ''
      }`}
    >
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-sm bg-[#faf8f5] shadow-md border-b-2 border-r border-[#d4cbbe]">
        <mah-gen data-seq={mahgenSeq} className="h-full w-full flex items-center justify-center pointer-events-none" />
      </div>
    </div>
  )
}
