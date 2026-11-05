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
  const doraMarkers: string[] = Array.isArray(result.dora_markers) ? result.dora_markers : []
  const uraMarkers: string[] = Array.isArray(result.ura_markers) ? result.ura_markers : []
  const winnerMelds: any[] = Array.isArray(result.winner_melds) ? result.winner_melds : []

  const getScoreDisplay = () => {
    const cost = result.score_info?.cost
    if (!cost) return '0 점'
    const isTsumo = result.is_tsumo ?? result.score_info?.is_tsumo
    const isDealer = result.score_info?.is_dealer
    const total =
      cost.total ||
      (isTsumo
        ? isDealer
          ? (cost.main || 0) * 3
          : (cost.main || 0) + (cost.additional || 0) * 2
        : cost.main || 0)

    if (isTsumo) {
      if (isDealer) {
        return `${total.toLocaleString()} 점 (${(cost.main || 0).toLocaleString()} ALL)`
      }
      return `${total.toLocaleString()} 점 (${(cost.additional || 0).toLocaleString()} / ${(cost.main || 0).toLocaleString()})`
    }
    return `${total.toLocaleString()} 점`
  }

  const getYakuLevelBadge = () => {
    const info = result.score_info
    if (!info) return null
    let name = info.yaku_level_name
    if (!name) {
      const han = info.han || 0
      const fu = info.fu || 0
      const raw = (info.cost?.yaku_level || '').toLowerCase()
      const isYakuman = info.yaku?.some((y: any) => y.is_yakuman)
      if (isYakuman || raw.includes('yakuman') || han >= 13) name = '역만 (役満)'
      else if (raw.includes('sanbaiman') || han >= 11) name = '삼배만 (三倍満)'
      else if (raw.includes('baiman') || han >= 8) name = '배만 (倍満)'
      else if (raw.includes('haneman') || han >= 6) name = '하네만 (跳満)'
      else if (raw.includes('mangan') || han >= 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70))
        name = '만관 (満貫)'
    }
    if (!name) return null

    const isYakuman = name.includes('역만')
    const isHigh = name.includes('배만') || name.includes('삼배만')
    return (
      <span
        className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wider shadow-md ${
          isYakuman
            ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white animate-pulse'
            : isHigh
            ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white'
            : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold'
        }`}
      >
        {name}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-[620px] max-w-[95vw] rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 p-6 shadow-2xl flex flex-col items-center gap-4">
        {/* Title Header */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          {isHora && (
            <>
              <h2 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                {result.winner_name} {result.is_tsumo ? '쯔모 화료 (自摸和了)!' : '론 화료 (栄和)!'}
              </h2>
              {getYakuLevelBadge()}
            </>
          )}
          {isRyuukyoku && (
            <h2 className="text-2xl font-black tracking-wide text-slate-300">
              유국 (流局 - Exhaustive Draw)
            </h2>
          )}
        </div>

        {/* Winner Hand + Win Tile + Open Melds Display */}
        {isHora && result.winner_hand && (
          <div className="flex flex-wrap items-end justify-center gap-3 p-3 bg-black/40 rounded-xl border border-white/10 w-full">
            {/* Closed Hand */}
            <div className="flex items-end gap-0.5">
              {result.winner_hand.map((tile: string, idx: number) => (
                <MahjongTile key={`wh-${idx}`} tile={tile} size="sm" />
              ))}
            </div>

            {/* Winning Tile */}
            {result.pai && (
              <div className="flex flex-col items-center gap-0.5 ml-1">
                <span className="text-[10px] font-black text-amber-400">
                  {result.is_tsumo ? '쯔모' : '론'}
                </span>
                <div className="ring-2 ring-amber-400 rounded-md">
                  <MahjongTile tile={result.pai} size="sm" />
                </div>
              </div>
            )}

            {/* Open Melds */}
            {winnerMelds.length > 0 && (
              <div className="flex items-end gap-2 ml-2">
                {winnerMelds.map((meld: any, mIdx: number) => (
                  <div
                    key={`wm-${mIdx}`}
                    className="flex items-end gap-0.5 bg-slate-900/80 px-1.5 py-1 rounded border border-white/10"
                  >
                    {meld.tiles.map((t: string, tIdx: number) => (
                      <MahjongTile
                        key={`wmt-${mIdx}-${tIdx}`}
                        tile={t}
                        size="xs"
                        horizontal={tIdx === meld.rot_idx}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dora & Ura-Dora (shown only on Riichi win) */}
        {isHora && (
          <div className="flex flex-wrap items-center justify-center gap-4 px-3 py-2 bg-slate-950/70 rounded-xl border border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-400">도라 표시패:</span>
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((idx) =>
                  idx < doraMarkers.length ? (
                    <MahjongTile key={`res-dora-${idx}`} tile={doraMarkers[idx]} size="xs" />
                  ) : (
                    <MahjongTile key={`res-dora-${idx}`} tile="1m" faceDown={true} size="xs" />
                  )
                )}
              </div>
            </div>

            {result.is_riichi && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-rose-400">뒷도라 (Ura):</span>
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((idx) =>
                    idx < uraMarkers.length ? (
                      <MahjongTile key={`res-ura-${idx}`} tile={uraMarkers[idx]} size="xs" />
                    ) : (
                      <MahjongTile key={`res-ura-${idx}`} tile="1m" faceDown={true} size="xs" />
                    )
                  )}
                </div>
              </div>
            )}
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
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-bold">
                  {result.score_info.han}판 {result.score_info.fu}부
                </span>
                {getYakuLevelBadge()}
              </div>
              <span className="text-xl text-amber-300 font-mono font-black">
                {getScoreDisplay()}
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
