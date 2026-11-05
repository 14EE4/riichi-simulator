import React from 'react'
import { MahjongTile } from './MahjongTile'

export interface DiscardItem {
  tile: string
  tsumogiri?: boolean
  riichi?: boolean
}

interface RiverProps {
  discards: DiscardItem[]
  lastDiscard?: boolean
  className?: string
}

export const River: React.FC<RiverProps> = ({ discards, className = '' }) => {
  // 6 tiles per row
  const rows: DiscardItem[][] = []
  for (let i = 0; i < discards.length; i += 6) {
    rows.push(discards.slice(i, i + 6))
  }

  return (
    <div
      className={`flex flex-col gap-0.5 p-1.5 bg-black/40 rounded-xl backdrop-blur-md min-h-[115px] min-w-[232px] border border-white/10 shadow-inner shrink-0 ${className}`}
    >
      {rows.length === 0 ? (
        <div className="flex h-full items-center justify-center text-xs text-slate-500 italic p-3">
          버림패 없음
        </div>
      ) : (
        rows.map((row, rIdx) => (
          <div key={rIdx} className="flex flex-row items-center gap-0.5">
            {row.map((item, cIdx) => {
              const isLatest = rIdx === rows.length - 1 && cIdx === row.length - 1
              return (
                <div key={cIdx} className="relative">
                  <MahjongTile
                    tile={item.tile}
                    size="sm"
                    horizontal={item.riichi}
                    highlight={isLatest}
                  />
                  {item.tsumogiri && (
                    <div
                      className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-slate-300 border border-slate-900 shadow-xs"
                      title="쯔모기리"
                    />
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
