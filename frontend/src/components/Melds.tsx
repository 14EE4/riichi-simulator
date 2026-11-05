import React from 'react'
import { MahjongTile } from './MahjongTile'

export interface MeldItem {
  type: string
  tiles: string[]
  from?: number
}

interface MeldsProps {
  melds: MeldItem[]
}

export const Melds: React.FC<MeldsProps> = ({ melds }) => {
  if (!melds || melds.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {melds.map((meld, mIdx) => (
        <div key={mIdx} className="flex items-end gap-0.5 bg-black/40 p-1 rounded border border-white/5 shadow-xs">
          {meld.tiles.map((tile, tIdx) => (
            <MahjongTile key={tIdx} tile={tile} size="sm" />
          ))}
        </div>
      ))}
    </div>
  )
}
