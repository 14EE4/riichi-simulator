import React from 'react'
import { MahjongTile } from './MahjongTile'

export interface MeldItem {
  type: string
  tiles: string[]
  from?: number
  rot_idx?: number
  called_tile?: string
}

interface MeldsProps {
  melds: MeldItem[]
  orientation?: 'bottom' | 'top' | 'left' | 'right'
}

export const Melds: React.FC<MeldsProps> = ({
  melds,
  orientation = 'bottom',
}) => {
  if (!melds || melds.length === 0) return null

  const isPlayer = orientation === 'bottom'
  const tileSize = isPlayer ? 'md' : 'xs'
  const isVertical = orientation === 'left' || orientation === 'right'
  const rotateClass =
    orientation === 'top'
      ? 'rotate-180 origin-center'
      : orientation === 'left'
      ? 'rotate-90 origin-center'
      : orientation === 'right'
      ? '-rotate-90 origin-center'
      : ''

  return (
    <div
      className={`flex ${
        isVertical ? 'flex-col gap-1.5' : 'flex-row gap-2'
      } items-center justify-center shrink-0 z-10`}
    >
      {melds.map((meld, mIdx) => {
        const isKan = meld.tiles.length >= 4
        const wrapperStyle = isVertical
          ? { width: '48px', height: isKan ? '138px' : '110px' }
          : undefined

        return (
          <div
            key={mIdx}
            style={wrapperStyle}
            className="flex items-center justify-center shrink-0"
          >
            <div
              className={`flex items-end gap-0.5 bg-black/50 px-1.5 py-1 rounded border border-white/10 shadow-sm shrink-0 ${rotateClass}`}
            >
              {meld.tiles.map((tile, tIdx) => {
                const isHorizontal =
                  meld.rot_idx !== undefined ? tIdx === meld.rot_idx : false
                return (
                  <MahjongTile
                    key={tIdx}
                    tile={tile}
                    size={tileSize}
                    horizontal={isHorizontal}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
