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
      } items-center justify-center p-1 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-md shadow-md shrink-0`}
    >
      {dummyTiles.map((_, idx) => (
        <MahjongTile
          key={idx}
          tile="1m"
          size="xs"
          faceDown={true}
          horizontal={vertical}
        />
      ))}
    </div>
  )
}
