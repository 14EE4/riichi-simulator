import React from 'react'
import { MahjongTile } from './MahjongTile'
import { formatShanten } from '../utils/tiles'

interface PlayerHandProps {
  hand: string[]
  isMyTurn: boolean
  canDiscard: boolean
  isReachReady?: boolean
  selectedTile: string | null
  onTileClick: (tile: string) => void
  shanten: number | null
  waits: string[]
  furiten?: boolean
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  isMyTurn,
  canDiscard,
  isReachReady = false,
  selectedTile,
  onTileClick,
  shanten,
  waits,
  furiten = false,
}) => {
  // If 14 tiles (e.g. drawn), separate the 14th tile slightly
  const hasDrawn = hand.length % 3 === 2
  const mainHand = hasDrawn ? hand.slice(0, hand.length - 1) : hand
  const drawnTile = hasDrawn ? hand[hand.length - 1] : null
  const validWaits = Array.isArray(waits) ? waits.filter(t => typeof t === 'string' && t.length > 0) : []

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      {/* Hand Status Bar: Shanten, Waits, Furiten alert */}
      <div className="flex items-center gap-3 px-3 py-1 bg-slate-900/80 rounded-full border border-white/10 text-xs shadow-md">
        <span className="font-semibold text-amber-400">
          {formatShanten(shanten)}
        </span>

        {validWaits && validWaits.length > 0 && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-[11px] text-slate-400">대기패:</span>
            <div className="flex items-center gap-1">
              {validWaits.map((waitTile, idx) => (
                <MahjongTile key={idx} tile={waitTile} size="sm" />
              ))}
            </div>
          </div>
        )}

        {furiten && (
          <span className="px-1.5 py-0.5 rounded bg-red-600/90 text-white font-bold text-[10px]">
            후리텐 (Furiten)
          </span>
        )}
      </div>

      {/* Tiles Container */}
      <div className="flex items-end gap-0.5 px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 shadow-2xl backdrop-blur-md">
        {/* Main 13 tiles */}
        <div className="flex items-end gap-0.5">
          {mainHand.map((tile, idx) => (
            <MahjongTile
              key={idx}
              tile={tile}
              size="lg"
              selected={selectedTile === tile}
              onClick={() => canDiscard && onTileClick(tile)}
              disabled={!canDiscard}
              highlight={isReachReady}
            />
          ))}
        </div>

        {/* Drawn tile with slight gap */}
        {drawnTile && (
          <div className="ml-3 pl-2 flex items-end">
            <MahjongTile
              tile={drawnTile}
              size="lg"
              selected={selectedTile === drawnTile}
              onClick={() => canDiscard && onTileClick(drawnTile)}
              disabled={!canDiscard}
              highlight={isReachReady}
            />
          </div>
        )}
      </div>
    </div>
  )
}
