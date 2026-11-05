import React from 'react'
import { MahjongTile } from './MahjongTile'

interface OpponentHandProps {
  tileCount?: number
  vertical?: boolean
}

export const OpponentHand: React.FC<OpponentHandProps> = ({
  tileCount = 13,
  vertical = false,
}) => {
  const dummyTiles = Array.from({ length: tileCount })

  return (
    <div
      className={`flex ${
        vertical ? 'flex-col gap-0.5' : 'flex-row gap-0.5'
      } items-center justify-center p-1 rounded-lg bg-slate-950/40 border border-white/5 backdrop-blur-xs`}
    >
      {dummyTiles.map((_, idx) => (
        <MahjongTile
          key={idx}
          tile="1m"
          size="sm"
          faceDown={true}
          horizontal={vertical}
        />
      ))}
    </div>
  )
}
