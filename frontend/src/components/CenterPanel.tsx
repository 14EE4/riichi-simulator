import React from 'react'
import { formatKyoku } from '../utils/tiles'

interface CenterPanelProps {
  bakaze: string
  kyoku: number
  honba: number
  kyotaku: number
  oya: number
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
  tilesLeft,
  scores,
  currentTurn,
  riichiDeclared,
}) => {
  const getWindStyle = (seat: number) => {
    const isEast = (seat - oya + 4) % 4 === 0
    return isEast
      ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-300 shadow-sm'
      : 'bg-slate-800 text-amber-200 border border-amber-500/40'
  }

  return (
    <div className="relative flex items-center justify-center w-64 h-64 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-2xl backdrop-blur-md select-none shrink-0">
      {/* Top Seat: Toimen (Seat 2) [Rotated 180deg facing North player] */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-36 h-9 flex justify-center rotate-180 origin-center z-20">
        <div
          className={`w-full h-full flex items-center justify-between px-2.5 rounded-xl transition-all ${
            currentTurn === 2 ? 'bg-amber-500/30 ring-2 ring-amber-400 shadow-md' : 'bg-black/70 border border-white/15'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-base leading-none ${getWindStyle(2)}`}
            >
              {SEAT_WINDS[(2 - oya + 4) % 4]}
            </span>
            {riichiDeclared[2] && (
              <span className="text-[11px] px-1.5 py-0.5 bg-red-600 text-white rounded font-black animate-pulse">
                리치
              </span>
            )}
          </div>
          <div className="text-base font-mono font-black tracking-tight text-amber-300">
            {scores[2].toLocaleString()}
          </div>
        </div>
      </div>

      {/* Left Seat: Kamicha (Seat 3) [Rotated 90deg facing West player] */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-36 flex items-center justify-center z-20">
        <div
          className={`w-36 h-9 flex items-center justify-between px-2.5 rounded-xl transition-all rotate-90 origin-center shrink-0 ${
            currentTurn === 3 ? 'bg-amber-500/30 ring-2 ring-amber-400 shadow-md' : 'bg-black/70 border border-white/15'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-base leading-none ${getWindStyle(3)}`}
            >
              {SEAT_WINDS[(3 - oya + 4) % 4]}
            </span>
            {riichiDeclared[3] && (
              <span className="text-[11px] px-1.5 py-0.5 bg-red-600 text-white rounded font-black animate-pulse">
                리치
              </span>
            )}
          </div>
          <div className="text-base font-mono font-black tracking-tight text-amber-300">
            {scores[3].toLocaleString()}
          </div>
        </div>
      </div>

      {/* Center Core Display: Round, Honba, Tiles Left, Riichi Sticks */}
      <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-black/80 border border-amber-500/30 shadow-inner z-10 w-36 h-36">
        {/* Round Name */}
        <div className="text-base font-black tracking-wider text-amber-400">
          {formatKyoku(bakaze, kyoku, honba)}
        </div>

        {/* Tiles Left & Riichi Sticks */}
        <div className="flex flex-col items-center gap-1 text-sm font-mono font-bold text-slate-300">
          <span>
            남은패: <b className="text-emerald-400 text-base font-black">{tilesLeft}</b>
          </span>
          {kyotaku > 0 && (
            <span className="flex items-center text-xs text-red-400 font-black" title={`리치봉 공탁 ${kyotaku}개`}>
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1 shadow-xs" />
              공탁 {kyotaku}
            </span>
          )}
        </div>
      </div>

      {/* Right Seat: Shimocha (Seat 1) [Rotated -90deg facing East player] */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-36 flex items-center justify-center z-20">
        <div
          className={`w-36 h-9 flex items-center justify-between px-2.5 rounded-xl transition-all -rotate-90 origin-center shrink-0 ${
            currentTurn === 1 ? 'bg-amber-500/30 ring-2 ring-amber-400 shadow-md' : 'bg-black/70 border border-white/15'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-base leading-none ${getWindStyle(1)}`}
            >
              {SEAT_WINDS[(1 - oya + 4) % 4]}
            </span>
            {riichiDeclared[1] && (
              <span className="text-[11px] px-1.5 py-0.5 bg-red-600 text-white rounded font-black animate-pulse">
                리치
              </span>
            )}
          </div>
          <div className="text-base font-mono font-black tracking-tight text-amber-300">
            {scores[1].toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bottom Seat: You (Seat 0) [0deg normal orientation facing player] */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-9 flex justify-center z-20">
        <div
          className={`w-full h-full flex items-center justify-between px-2.5 rounded-xl transition-all ${
            currentTurn === 0 ? 'bg-amber-500/30 ring-2 ring-amber-400 shadow-md' : 'bg-black/70 border border-white/15'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-base leading-none ${getWindStyle(0)}`}
            >
              {SEAT_WINDS[(0 - oya + 4) % 4]}
            </span>
            {riichiDeclared[0] && (
              <span className="text-[11px] px-1.5 py-0.5 bg-red-600 text-white rounded font-black animate-pulse">
                리치
              </span>
            )}
          </div>
          <div className="text-base font-mono font-black tracking-tight text-amber-300">
            {scores[0].toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
