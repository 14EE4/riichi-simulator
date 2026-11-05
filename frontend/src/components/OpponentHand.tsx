import React from 'react'
import { MahjongTile } from './MahjongTile'

interface OpponentHandProps {
  tileCount?: number
  vertical?: boolean
  openTiles?: string[]
}

export const OpponentHand: React.FC<OpponentHandProps> = ({
  tileCount = 13,
  vertical = false,
  openTiles,
}) => {
  if (openTiles && openTiles.length > 0) {
    return (
      <div
        className={`flex ${
          vertical ? 'flex-col gap-0.5' : 'flex-row gap-0.5'
        } items-center justify-center p-1.5 rounded-xl bg-amber-950/40 border-2 border-amber-400 shadow-2xl backdrop-blur-md shrink-0 ring-2 ring-amber-400/50`}
      >
        {openTiles.map((tile, idx) => (
          <MahjongTile
            key={idx}
            tile={tile}
            size="xs"
            horizontal={vertical}
          />
        ))}
      </div>
    )
  }

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
