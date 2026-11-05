import React from 'react'
import { MahjongTile } from './MahjongTile'
import { formatShanten } from '../utils/tiles'

interface PlayerHandProps {
  hand: string[]
  isMyTurn: boolean
  canDiscard: boolean
  isReachReady?: boolean
  riichiDiscards?: string[]
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
  riichiDiscards = [],
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

  // When in Riichi preparation mode, only tiles in riichiDiscards can be discarded
  const isTileDiscardable = (tile: string) => {
    if (!canDiscard) return false
    if (isReachReady && riichiDiscards && riichiDiscards.length > 0) {
      return riichiDiscards.includes(tile)
    }
    return true
  }

  const isTileHighlighted = (tile: string) => {
    if (isReachReady && riichiDiscards && riichiDiscards.length > 0) {
      return riichiDiscards.includes(tile)
    }
    return false
  }

  return (
    <div className="flex flex-col items-center gap-1 select-none shrink-0">
      {/* Hand Status Bar: Shanten, Waits, Furiten alert, Riichi Mode Alert */}
      <div className="flex items-center gap-2.5 px-3 py-0.5 bg-slate-900/85 rounded-full border border-white/10 text-xs shadow-md">
        {isReachReady ? (
          <span className="font-bold text-rose-400 animate-pulse flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
            리치할 타패를 선택하세요 (하이라이트된 패만 가능)
          </span>
        ) : (
          <span className="font-semibold text-amber-400">
            {formatShanten(shanten)}
          </span>
        )}

        {validWaits && validWaits.length > 0 && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-[11px] text-slate-400">대기패:</span>
            <div className="flex items-center gap-0.5">
              {validWaits.map((waitTile, idx) => (
                <MahjongTile key={idx} tile={waitTile} size="sm" />
              ))}
            </div>
          </div>
        )}

        {furiten && (
          <span className="px-1.5 py-0.2 rounded bg-red-600/90 text-white font-bold text-[10px]">
            후리텐 (Furiten)
          </span>
        )}
      </div>

      {/* Tiles Container */}
      <div
        className={`flex items-end gap-0.5 px-2.5 py-1.5 rounded-xl bg-slate-950/70 border backdrop-blur-md shadow-2xl transition-all ${
          isReachReady ? 'border-amber-400/80 ring-2 ring-amber-400/30' : 'border-white/10'
        }`}
      >
        {/* Main 13 tiles */}
        <div className="flex items-end gap-0.5">
          {mainHand.map((tile, idx) => {
            const discardable = isTileDiscardable(tile)
            const highlight = isTileHighlighted(tile)
            return (
              <div key={idx} className="relative">
                <MahjongTile
                  tile={tile}
                  size="lg"
                  selected={selectedTile === tile}
                  onClick={() => discardable && onTileClick(tile)}
                  disabled={!discardable}
                  highlight={highlight}
                />
                {highlight && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black bg-gradient-to-r from-red-600 to-rose-600 text-white px-1 rounded shadow-xs pointer-events-none">
                    리치
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Drawn tile with slight gap */}
        {drawnTile && (
          <div className="ml-2.5 pl-1.5 flex items-end">
            {(() => {
              const discardable = isTileDiscardable(drawnTile)
              const highlight = isTileHighlighted(drawnTile)
              return (
                <div className="relative">
                  <MahjongTile
                    tile={drawnTile}
                    size="lg"
                    selected={selectedTile === drawnTile}
                    onClick={() => discardable && onTileClick(drawnTile)}
                    disabled={!discardable}
                    highlight={highlight}
                  />
                  {highlight && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black bg-gradient-to-r from-red-600 to-rose-600 text-white px-1 rounded shadow-xs pointer-events-none">
                      리치
                    </span>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
