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
}

export const Melds: React.FC<MeldsProps> = ({ melds }) => {
  if (!melds || melds.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {melds.map((meld, mIdx) => (
        <div key={mIdx} className="flex items-end gap-0.5 bg-black/40 px-1.5 py-1 rounded border border-white/5 shadow-xs">
          {meld.tiles.map((tile, tIdx) => {
            const isHorizontal = meld.rot_idx !== undefined ? tIdx === meld.rot_idx : false
            return (
              <MahjongTile
                key={tIdx}
                tile={tile}
                size="sm"
                horizontal={isHorizontal}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
