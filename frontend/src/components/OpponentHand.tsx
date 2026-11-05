import React from 'react'
import { MahjongTile } from './MahjongTile'

interface OpponentHandProps {
  tileCount?: number
}

export const OpponentHand: React.FC<OpponentHandProps> = ({
  tileCount = 13,
}) => {
  const dummyTiles = Array.from({ length: tileCount })

  return (
    <div className="flex flex-row gap-0.5 items-center justify-center p-1 rounded-lg bg-slate-950/40 border border-white/5 backdrop-blur-xs shadow-xs">
      {dummyTiles.map((_, idx) => (
        <MahjongTile
          key={idx}
          tile="1m"
          size="sm"
          faceDown={true}
        />
      ))}
    </div>
  )
}
