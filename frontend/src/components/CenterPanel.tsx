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
    <div className="relative flex items-center justify-center w-72 h-72 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-2xl backdrop-blur-md select-none shrink-0">
      {/* Top Seat: Toimen (Seat 2 - North) [Rotated 180deg facing North player] */}
      <div className="absolute top-2 inset-x-3 flex justify-center rotate-180 origin-center">
        <div
          className={`w-full flex items-center justify-between px-3 py-1 rounded-lg transition-all ${
            currentTurn === 2 ? 'bg-amber-500/30 ring-2 ring-amber-400 shadow-md' : 'bg-black/50 border border-white/5'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
              {SEAT_WINDS[(2 - oya + 4) % 4]}
            </span>
            <span className="truncate max-w-[85px] text-slate-200">{names[2]}</span>
            {riichiDeclared[2] && (
              <span className="text-[10px] px-1 bg-red-600 text-white rounded font-bold">리치</span>
            )}
          </div>
          <div className="text-sm font-mono font-bold text-amber-300">
            {scores[2].toLocaleString()}
          </div>
        </div>
      </div>

      {/* Left Seat: Kamicha (Seat 3 - West) [Rotated 90deg facing West player] */}
      <div className="absolute left-2 inset-y-12 flex items-center justify-center rotate-90 origin-center">
        <div
          className={`w-44 flex items-center justify-between px-3 py-1 rounded-lg transition-all ${
            currentTurn === 3 ? 'bg-amber-500/30 ring-2 ring-amber-400 shadow-md' : 'bg-black/50 border border-white/5'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
              {SEAT_WINDS[(3 - oya + 4) % 4]}
            </span>
            <span className="truncate max-w-[70px] text-slate-200">{names[3]}</span>
            {riichiDeclared[3] && (
              <span className="text-[10px] px-1 bg-red-600 text-white rounded font-bold">리치</span>
            )}
          </div>
          <div className="text-sm font-mono font-bold text-amber-300">
            {scores[3].toLocaleString()}
          </div>
        </div>
      </div>

      {/* Center Core Display: Round, Honba, Dora, Tiles Left */}
      <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-black/60 border border-amber-500/20 shadow-inner z-10 w-44">
        {/* Round Name */}
        <div className="text-xs font-black tracking-wider text-amber-400">
          {formatKyoku(bakaze, kyoku, honba)}
        </div>

        {/* Dora Indicator Panel */}
        <div className="flex flex-col items-center bg-slate-950/80 px-2 py-1 rounded-md border border-white/10 shadow-xs">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">DORA</span>
          <div className="flex items-center gap-1 mt-0.5">
            {doraMarkers.map((dora, idx) => (
              <MahjongTile key={idx} tile={dora} size="sm" />
            ))}
          </div>
        </div>

        {/* Tiles Left & Riichi Sticks */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
          <span>남은패: <b className="text-emerald-400">{tilesLeft}</b></span>
          {kyotaku > 0 && (
            <span className="flex items-center text-red-400">
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 shadow-xs" />
              {kyotaku}
            </span>
          )}
        </div>
      </div>

      {/* Right Seat: Shimocha (Seat 1 - East) [Rotated -90deg facing East player] */}
      <div className="absolute right-2 inset-y-12 flex items-center justify-center -rotate-90 origin-center">
        <div
          className={`w-44 flex items-center justify-between px-3 py-1 rounded-lg transition-all ${
            currentTurn === 1 ? 'bg-amber-500/30 ring-2 ring-amber-400 shadow-md' : 'bg-black/50 border border-white/5'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
              {SEAT_WINDS[(1 - oya + 4) % 4]}
            </span>
            <span className="truncate max-w-[70px] text-slate-200">{names[1]}</span>
            {riichiDeclared[1] && (
              <span className="text-[10px] px-1 bg-red-600 text-white rounded font-bold">리치</span>
            )}
          </div>
          <div className="text-sm font-mono font-bold text-amber-300">
            {scores[1].toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bottom Seat: You (Seat 0 - South) [0deg normal orientation facing player] */}
      <div className="absolute bottom-2 inset-x-3 flex justify-center">
        <div
          className={`w-full flex items-center justify-between px-3 py-1 rounded-lg transition-all ${
            currentTurn === 0 ? 'bg-amber-500/30 ring-2 ring-amber-400 shadow-md' : 'bg-black/50 border border-white/5'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-amber-600 text-slate-950 font-black">
              {SEAT_WINDS[(0 - oya + 4) % 4]}
            </span>
            <span className="text-amber-300 font-bold">{names[0]} (나)</span>
            {riichiDeclared[0] && (
              <span className="text-[10px] px-1 bg-red-600 text-white rounded font-bold">리치</span>
            )}
          </div>
          <div className="text-sm font-mono font-black text-amber-300">
            {scores[0].toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
