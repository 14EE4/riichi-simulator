import React from 'react'
import { MahjongTile } from './MahjongTile'

interface ResultModalProps {
  isOpen: boolean
  result: any
  gameOver: boolean
  onNextKyoku: () => void
  onNewGame: () => void
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  result,
  gameOver,
  onNextKyoku,
  onNewGame,
}) => {
  if (!isOpen || !result) return null

  const isHora = result.type === 'hora'
  const isRyuukyoku = result.type === 'ryuukyoku'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-[500px] max-w-[90vw] rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 p-6 shadow-2xl flex flex-col items-center gap-4">
        {/* Title Header */}
        <div className="text-center">
          {isHora && (
            <h2 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
              {result.winner_name} 화료 (和了)!
            </h2>
          )}
          {isRyuukyoku && (
            <h2 className="text-2xl font-black tracking-wide text-slate-300">
              유국 (流局 - Exhaustive Draw)
            </h2>
          )}
        </div>

        {/* Winner Hand Display */}
        {isHora && result.winner_hand && (
          <div className="flex flex-wrap items-center justify-center gap-1 p-3 bg-black/40 rounded-xl border border-white/10">
            {result.winner_hand.map((tile: string, idx: number) => (
              <MahjongTile key={idx} tile={tile} size="md" />
            ))}
          </div>
        )}

        {/* Yaku & Score Breakdown */}
        {isHora && result.score_info && (
          <div className="w-full flex flex-col gap-2 bg-slate-900/60 p-4 rounded-xl border border-white/5">
            {/* Yaku list */}
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
              {result.score_info.yaku?.map((y: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-200 font-medium">{y.name}</span>
                  <span className="text-amber-400 font-bold">{y.han}판</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 my-1" />

            {/* Total Han & Fu & Cost */}
            <div className="flex items-center justify-between text-base font-bold">
              <span className="text-slate-400">
                {result.score_info.han}판 {result.score_info.fu}부
              </span>
              <span className="text-xl text-amber-300 font-mono">
                {result.score_info.cost?.main?.toLocaleString()} 점
              </span>
            </div>
          </div>
        )}

        {/* Ryuukyoku Tenpai Breakdown */}
        {isRyuukyoku && result.tenpai && (
          <div className="w-full flex flex-col gap-2 bg-slate-900/60 p-4 rounded-xl border border-white/5 text-sm">
            <span className="text-slate-400 font-medium">텐파이 상태:</span>
            <div className="grid grid-cols-2 gap-2">
              {['You (나)', 'Mortal 1', 'Mortal 2', 'Mortal 3'].map((pName, sIdx) => (
                <div
                  key={sIdx}
                  className={`p-2 rounded font-semibold flex items-center justify-between ${
                    result.tenpai[sIdx]
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800/40 text-slate-400'
                  }`}
                >
                  <span>{pName}</span>
                  <span>{result.tenpai[sIdx] ? '텐파이' : '노텐'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score Delta */}
        {result.score_delta && (
          <div className="w-full grid grid-cols-4 gap-1 text-center text-xs">
            {['You', 'M1', 'M2', 'M3'].map((name, sIdx) => {
              const delta = result.score_delta[sIdx]
              return (
                <div key={sIdx} className="p-1.5 rounded bg-black/30">
                  <div className="text-slate-400 font-medium">{name}</div>
                  <div
                    className={`font-mono font-bold mt-0.5 ${
                      delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}
                  >
                    {delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Action Button */}
        <div className="w-full mt-2">
          {gameOver ? (
            <button
              onClick={onNewGame}
              className="w-full py-3 rounded-xl font-black text-base bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              대국 종료 (최종 결과) - 새 게임 시작
            </button>
          ) : (
            <button
              onClick={onNextKyoku}
              className="w-full py-3 rounded-xl font-black text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              다음 국 진행 (Next Hand)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
