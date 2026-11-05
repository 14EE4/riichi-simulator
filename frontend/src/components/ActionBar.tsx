import React from 'react'

export interface PromptAction {
  type: string
  actor: number
  actions: string[]
  options?: Record<string, any>
  target_tile?: string
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
          className={`px-5 py-2.5 rounded-xl font-black text-sm text-white shadow-lg transition-all active:scale-95 cursor-pointer ring-2 ${
            isReachMode
              ? 'bg-amber-500 ring-amber-300 shadow-amber-500/50'
              : 'bg-gradient-to-r from-amber-600 to-yellow-600 ring-amber-400/50 hover:brightness-125'
          }`}
        >
          {isReachMode ? '타패할 패를 선택하세요' : '리치 (RIICHI)'}
        </button>
      )}

      {/* Pon */}
      {canPon && (
        <button
          onClick={() => onAction('pon')}
          className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:brightness-125 transition-all active:scale-95 cursor-pointer border border-blue-400/40"
        >
          퐁 (PON)
        </button>
      )}

      {/* Chi */}
      {canChi && (
        <button
          onClick={() => {
            const patterns = prompt.options?.chi_patterns || []
            const consumed = patterns[0] || []
            onAction('chi', { consumed })
          }}
          className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md hover:brightness-125 transition-all active:scale-95 cursor-pointer border border-teal-400/40"
        >
          치 (CHI)
        </button>
      )}

      {/* Kan */}
      {canKan && (
        <button
          onClick={() => onAction('daiminkan')}
          className="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md hover:brightness-125 transition-all active:scale-95 cursor-pointer border border-purple-400/40"
        >
          깡 (KAN)
        </button>
      )}

      {/* Pass */}
      {isCall && (
        <button
          onClick={() => onAction('pass')}
          className="px-4 py-2 rounded-xl font-bold text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all active:scale-95 cursor-pointer border border-white/10"
        >
          패스 (PASS)
        </button>
      )}
    </div>
  )
}
