import React from 'react'

export interface PromptAction {
  type: string
  actor: number
  actions: string[]
  options?: Record<string, any>
  target_tile?: string
  riichi_discards?: string[]
}

interface ActionBarProps {
  prompt: PromptAction | null
  onAction: (action: string, data?: any) => void
  isReachMode: boolean
  setIsReachMode: (val: boolean) => void
}

export const ActionBar: React.FC<ActionBarProps> = ({
  prompt,
  onAction,
  isReachMode,
  setIsReachMode,
}) => {
  if (!prompt || !prompt.actions || prompt.actions.length === 0) return null

  const actions = prompt.actions

  const canTsumo = actions.includes('tsumo_agari')
  const canRon = actions.includes('ron_agari')
  const canRiichi = actions.includes('riichi')
  const canPon = actions.includes('pon')
  const canChi = actions.includes('chi')
  const canKan = actions.includes('daiminkan') || actions.includes('ankan') || actions.includes('kakan')
  const isCall = prompt.type === 'call_action'

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-950/90 rounded-2xl border-2 border-amber-500/40 shadow-2xl backdrop-blur-md animate-bounce-subtle">
      {/* Ron Agari */}
      {canRon && (
        <button
          onClick={() => onAction('ron_agari')}
          className="px-5 py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg shadow-red-600/50 hover:brightness-125 transition-all active:scale-95 cursor-pointer ring-2 ring-red-400"
        >
          론 (RON)
        </button>
      )}

      {/* Tsumo Agari */}
      {canTsumo && (
        <button
          onClick={() => onAction('tsumo_agari')}
          className="px-5 py-2.5 rounded-xl font-black text-sm bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg shadow-red-600/50 hover:brightness-125 transition-all active:scale-95 cursor-pointer ring-2 ring-red-400"
        >
          쯔모 (TSUMO)
        </button>
      )}

      {/* Riichi */}
      {canRiichi && (
        <button
          onClick={() => setIsReachMode(!isReachMode)}
          className={`px-4 py-2 rounded-xl font-black text-sm transition-all active:scale-95 cursor-pointer shadow-md ${
            isReachMode
              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-400/50 scale-105'
              : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950'
          }`}
        >
          {isReachMode ? '리치 취소' : '리치 (RIICHI)'}
        </button>
      )}

      {/* Pon */}
      {canPon && (
        <button
          onClick={() => onAction('pon')}
          className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md active:scale-95 cursor-pointer"
        >
          퐁 (PON)
        </button>
      )}

      {/* Chi */}
      {canChi && (
        <button
          onClick={() => {
            const patterns = prompt.options?.chi_patterns || []
            const consumed = patterns.length > 0 ? patterns[0] : []
            onAction('chi', { consumed })
          }}
          className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md active:scale-95 cursor-pointer"
        >
          치 (CHI)
        </button>
      )}

      {/* Kan */}
      {canKan && (
        <button
          onClick={() => onAction('daiminkan')}
          className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white shadow-md active:scale-95 cursor-pointer"
        >
          깡 (KAN)
        </button>
      )}

      {/* Pass (Available on any call action prompt) */}
      {isCall && (
        <button
          onClick={() => onAction('pass')}
          className="px-4 py-2 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 active:scale-95 transition-all cursor-pointer"
        >
          패스 (PASS)
        </button>
      )}
    </div>
  )
}
