import React from 'react'
import { MahjongTile } from './MahjongTile'
import { formatKyoku } from '../utils/tiles'

interface CenterPanelProps {
  bakaze: string
  kyoku: number
  honba: number
  kyotaku: number
  oya: number
  doraMarkers: string[]
  tilesLeft: number
  scores: number[]
  names: string[]
  currentTurn: number
  riichiDeclared: boolean[]
}

const SEAT_WINDS = ['동', '남', '서', '북']

export const CenterPanel: React.FC<CenterPanelProps> = ({
  bakaze,
  kyoku,
  honba,
  kyotaku,
  oya,
  doraMarkers,
  tilesLeft,
  scores,
  names,
  currentTurn,
  riichiDeclared,
}) => {
  return (
    <div className="relative flex flex-col items-center justify-between w-64 h-64 rounded-xl bg-slate-950/80 border-2 border-amber-600/30 p-3 shadow-2xl backdrop-blur-md">
      {/* Top Seat: Toimen (Seat 2 - North) */}
      <div
        className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors ${
          currentTurn === 2 ? 'bg-amber-500/20 ring-1 ring-amber-400' : 'bg-slate-900/40'
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {SEAT_WINDS[(2 - oya + 4) % 4]}
          </span>
          <span className="truncate max-w-[80px]">{names[2]}</span>
          {riichiDeclared[2] && (
            <span className="text-[10px] px-1 bg-red-600/80 text-white rounded font-bold">리치</span>
          )}
        </div>
        <div className="text-sm font-mono font-bold text-amber-200">
          {scores[2].toLocaleString()}
        </div>
      </div>

      {/* Middle Section: Left Seat (Kamicha), Center Info, Right Seat (Shimocha) */}
      <div className="flex w-full items-center justify-between gap-1 my-1">
        {/* Left Seat: Kamicha (Seat 3 - West) */}
        <div
          className={`flex flex-col items-center justify-center p-1.5 rounded min-w-[70px] ${
            currentTurn === 3 ? 'bg-amber-500/20 ring-1 ring-amber-400' : 'bg-slate-900/40'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold">
            <span className="px-1 rounded bg-slate-800 text-slate-300">
              {SEAT_WINDS[(3 - oya + 4) % 4]}
            </span>
            <span className="truncate max-w-[50px]">{names[3]}</span>
          </div>
          <div className="text-xs font-mono font-bold text-amber-200 mt-0.5">
            {scores[3].toLocaleString()}
          </div>
          {riichiDeclared[3] && (
            <span className="text-[9px] px-1 bg-red-600/80 text-white rounded font-bold mt-0.5">리치</span>
          )}
        </div>

        {/* Center Round Info & Dora Display */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="text-xs font-bold tracking-wider text-amber-300">
            {formatKyoku(bakaze, kyoku, honba)}
          </div>

          {/* Dora Panel */}
          <div className="flex flex-col items-center bg-black/40 px-2 py-1 rounded border border-white/10">
            <span className="text-[10px] text-slate-400 font-medium">도라 표시패</span>
            <div className="flex items-center gap-1 mt-0.5">
              {doraMarkers.map((dora, idx) => (
                <MahjongTile key={idx} tile={dora} size="sm" />
              ))}
            </div>
          </div>

          {/* Tiles Left & Riichi Sticks */}
          <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
            <span>남은패: <b className="text-emerald-400">{tilesLeft}</b></span>
            {kyotaku > 0 && (
              <span className="flex items-center text-red-400">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
                {kyotaku}
              </span>
            )}
          </div>
        </div>

        {/* Right Seat: Shimocha (Seat 1 - East) */}
        <div
          className={`flex flex-col items-center justify-center p-1.5 rounded min-w-[70px] ${
            currentTurn === 1 ? 'bg-amber-500/20 ring-1 ring-amber-400' : 'bg-slate-900/40'
          }`}
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold">
            <span className="px-1 rounded bg-slate-800 text-slate-300">
              {SEAT_WINDS[(1 - oya + 4) % 4]}
            </span>
            <span className="truncate max-w-[50px]">{names[1]}</span>
          </div>
          <div className="text-xs font-mono font-bold text-amber-200 mt-0.5">
            {scores[1].toLocaleString()}
          </div>
          {riichiDeclared[1] && (
            <span className="text-[9px] px-1 bg-red-600/80 text-white rounded font-bold mt-0.5">리치</span>
          )}
        </div>
      </div>

      {/* Bottom Seat: You (Seat 0 - South) */}
      <div
        className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors ${
          currentTurn === 0 ? 'bg-amber-500/20 ring-1 ring-amber-400' : 'bg-slate-900/40'
        }`}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className="px-1.5 py-0.5 rounded bg-amber-600 text-slate-950 font-bold">
            {SEAT_WINDS[(0 - oya + 4) % 4]}
          </span>
          <span className="text-amber-300">{names[0]} (나)</span>
          {riichiDeclared[0] && (
            <span className="text-[10px] px-1 bg-red-600/80 text-white rounded font-bold">리치</span>
          )}
        </div>
        <div className="text-sm font-mono font-bold text-amber-300">
          {scores[0].toLocaleString()}
        </div>
      </div>
    </div>
  )
}
