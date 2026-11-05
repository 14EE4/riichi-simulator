import React, { useEffect, useState, useRef } from 'react'
import { River, DiscardItem } from './components/River'
import { CenterPanel } from './components/CenterPanel'
import { PlayerHand } from './components/PlayerHand'
import { OpponentHand } from './components/OpponentHand'
import { Melds, MeldItem } from './components/Melds'
import { MahjongTile } from './components/MahjongTile'
import { ActionBar, PromptAction } from './components/ActionBar'
import { ResultModal } from './components/ResultModal'
import { Wifi, WifiOff, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import {
  playSound,
  unlockAudio,
  isMuted,
  setMuted as setSoundMuted,
  getVolume,
  setVolume as setSoundVolume,
} from './utils/sound'

interface GameState {
  names: string[]
  scores: number[]
  bakaze: string
  kyoku: number
  honba: number
  kyotaku: number
  oya: number
  dora_markers: string[]
  tiles_left: number
  current_turn: number
  my_hand: string[]
  my_shanten: number | null
  my_waits: string[]
  my_furiten: boolean
  discards: DiscardItem[][]
  melds: MeldItem[][]
  riichi_declared: boolean[]
  last_discard: any
  game_over: boolean
}

export function App() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [prompt, setPrompt] = useState<PromptAction | null>(null)
  const [connected, setConnected] = useState(false)
  const [selectedTile, setSelectedTile] = useState<string | null>(null)
  const [isReachMode, setIsReachMode] = useState(false)
  const [roundResult, setRoundResult] = useState<any | null>(null)
  const [horaAnnouncement, setHoraAnnouncement] = useState<{
    actor: number
    isTsumo: boolean
    winnerName: string
    pai: string
    hand: string[]
    yakuLevel?: string
  } | null>(null)

  const [soundMuted, setSoundMutedState] = useState(isMuted())
  const [soundVolume, setSoundVolumeState] = useState(getVolume())

  const socketRef = useRef<WebSocket | null>(null)
  const prevCounts = useRef({ discards: 0, melds: 0, riichi: 0 })

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  // 상태 변화로 효과음 재생: 타패 / 후로 / 리치
  useEffect(() => {
    if (!gameState) return
    const discards = gameState.discards.reduce((n, d) => n + d.length, 0)
    const melds = gameState.melds.reduce((n, m) => n + m.length, 0)
    const riichi = gameState.riichi_declared.filter(Boolean).length
    const prev = prevCounts.current
    if (riichi > prev.riichi) playSound('riichi')
    else if (melds > prev.melds) playSound('call')
    else if (discards > prev.discards) playSound('discard')
    prevCounts.current = { discards, melds, riichi }
  }, [gameState])

  const toggleMute = () => {
    const next = !soundMuted
    setSoundMuted(next)
    setSoundMutedState(next)
    if (!next) playSound('discard')
  }

  const changeVolume = (v: number) => {
    setSoundVolume(v)
    setSoundVolumeState(v)
  }

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.port === '5173' ? '127.0.0.1:8000' : window.location.host
    const wsUrl = `${protocol}//${host}/ws`

    const ws = new WebSocket(wsUrl)
    socketRef.current = ws

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.state) {
          setGameState(data.state)
        }
        if (data.prompt) {
          setPrompt(data.prompt)
        } else if (data.event === 'user_action_required' || data.event === 'user_call_required') {
          setPrompt(data.prompt)
        } else {
          setPrompt(null)
        }

        if (data.event === 'hora') {
          const info = data.result.score_info
          let yakuLevel = info?.yaku_level_name || ''
          if (!yakuLevel && info) {
            const han = info.han || 0
            const fu = info.fu || 0
            const raw = (info.cost?.yaku_level || '').toLowerCase()
            const isYakuman = info.yaku?.some((y: any) => y.is_yakuman)
            if (isYakuman || raw.includes('yakuman') || han >= 13) yakuLevel = '역만 (役満)'
            else if (raw.includes('sanbaiman') || han >= 11) yakuLevel = '삼배만 (三倍満)'
            else if (raw.includes('baiman') || han >= 8) yakuLevel = '배만 (倍満)'
            else if (raw.includes('haneman') || han >= 6) yakuLevel = '하네만 (跳満)'
            else if (raw.includes('mangan') || han >= 5 || (han === 4 && fu >= 40) || (han === 3 && fu >= 70))
              yakuLevel = '만관 (満貫)'
          }

          playSound(yakuLevel ? 'bigHora' : 'hora')
          setHoraAnnouncement({
            actor: data.result.actor,
            isTsumo: data.result.is_tsumo,
            winnerName: data.result.winner_name,
            pai: data.result.pai,
            hand: data.result.winner_hand,
            yakuLevel,
          })
          setTimeout(() => {
            setHoraAnnouncement(null)
            setRoundResult(data.result)
          }, 2000)
        } else if (data.event === 'ryuukyoku') {
          playSound('ryuukyoku')
          setRoundResult(data.result)
        }
      } catch (err) {
        console.error('Failed to parse websocket message:', err)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      setTimeout(connectWebSocket, 2000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }

  useEffect(() => {
    connectWebSocket()
    return () => {
      socketRef.current?.close()
    }
  }, [])

  const sendAction = (action: string, data: any = {}) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return
    socketRef.current.send(JSON.stringify({ action, data }))
  }

  const handleTileClick = (tile: string) => {
    sendAction('discard', { tile, is_reach: isReachMode })
    setIsReachMode(false)
    setSelectedTile(null)
  }

  const handleNewGame = () => {
    setRoundResult(null)
    setIsReachMode(false)
    sendAction('start_game')
  }

  const handleNextKyoku = () => {
    setRoundResult(null)
    setIsReachMode(false)
    sendAction('next_kyoku')
  }

  const isMyTurn = gameState?.current_turn === 0
  const canDiscard = isMyTurn && !!prompt?.actions?.includes('discard')

  const getClosedTileCount = (seat: number) => {
    const meldCount = gameState?.melds?.[seat]?.length || 0
    return Math.max(1, 13 - meldCount * 3)
  }

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-radial from-slate-900 via-slate-950 to-black text-slate-100 select-none">
      {/* Top Header (Compact) */}
      <header className="flex items-center justify-between px-4 py-1.5 bg-slate-950/80 border-b border-white/10 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <h1 className="text-sm font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
            Riichi Mahjong Simulator
          </h1>
          <span className="text-[11px] text-slate-400 font-semibold px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
            Mortal AI x3
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNewGame}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
            새 게임
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              title={soundMuted ? '소리 켜기' : '소리 끄기'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 active:scale-95 transition-all cursor-pointer"
            >
              {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={soundVolume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              disabled={soundMuted}
              title="볼륨"
              className="w-20 accent-amber-400 cursor-pointer disabled:opacity-40"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-xs">연결됨</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-500 font-semibold text-xs">연결 끊김</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Mahjong Mat (Table) */}
      <main className="relative flex-1 flex flex-col items-center justify-between px-2 py-1 overflow-hidden">
        {/* Top-Left Corner: 5 Dora Indicator Tiles (Wanpai top row) */}
        {gameState && (
          <div className="absolute top-2.5 left-4 z-20 flex flex-col gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950/85 border border-amber-500/30 shadow-lg backdrop-blur-md">
            <span className="text-[10px] font-bold text-amber-400 tracking-wider">도라 표시패 (ドラ)</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((idx) => {
                const isOpen = idx < (gameState.dora_markers?.length || 0)
                return isOpen ? (
                  <MahjongTile key={`tl-dora-${idx}`} tile={gameState.dora_markers[idx]} size="sm" />
                ) : (
                  <MahjongTile key={`tl-dora-${idx}`} tile="1m" faceDown={true} size="sm" />
                )
              })}
            </div>
          </div>
        )}

        {/* Left Side: Mortal 3 (Kamicha - West) anchored on the left without stretching vertical center column */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10">
          <div className="flex flex-col items-center justify-center gap-2 shrink-0">
            <OpponentHand
              tileCount={getClosedTileCount(3)}
              vertical={true}
              openTiles={horaAnnouncement?.actor === 3 ? horaAnnouncement.hand : undefined}
            />
            <Melds melds={gameState?.melds?.[3] || []} orientation="left" />
          </div>
          <div className="w-[155px] h-[240px] flex items-center justify-center shrink-0">
            <River discards={gameState?.discards?.[3] || []} className="rotate-90 origin-center" />
          </div>
        </div>

        {/* Right Side: Mortal 1 (Shimocha - East) anchored on the right without stretching vertical center column */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4 z-10">
          <div className="w-[155px] h-[240px] flex items-center justify-center shrink-0">
            <River discards={gameState?.discards?.[1] || []} className="-rotate-90 origin-center" />
          </div>
          <div className="flex flex-col items-center justify-center gap-2 shrink-0">
            <Melds melds={gameState?.melds?.[1] || []} orientation="right" />
            <OpponentHand
              tileCount={getClosedTileCount(1)}
              vertical={true}
              openTiles={horaAnnouncement?.actor === 1 ? horaAnnouncement.hand : undefined}
            />
          </div>
        </div>

        {/* Top: Mortal 2 (Toimen - North) */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <Melds melds={gameState?.melds?.[2] || []} orientation="top" />
            <OpponentHand
              tileCount={getClosedTileCount(2)}
              openTiles={horaAnnouncement?.actor === 2 ? horaAnnouncement.hand : undefined}
            />
          </div>
          <River discards={gameState?.discards?.[2] || []} className="rotate-180 origin-center" />
        </div>

        {/* Center Info Panel */}
        <div className="flex items-center justify-center shrink-0 my-auto">
          {gameState && (
            <CenterPanel
              bakaze={gameState.bakaze}
              kyoku={gameState.kyoku}
              honba={gameState.honba}
              kyotaku={gameState.kyotaku}
              oya={gameState.oya}
              tilesLeft={gameState.tiles_left}
              scores={gameState.scores}
              names={gameState.names}
              currentTurn={gameState.current_turn}
              riichiDeclared={gameState.riichi_declared}
            />
          )}
        </div>

        {/* Bottom: Player (You - South) */}
        <div className="relative flex flex-col items-center gap-1 w-full shrink-0 pb-1">
          {/* Floating Action Bar */}
          {prompt && prompt.actions && prompt.actions.length > 0 && (
            <div className="absolute -top-12 z-30 flex items-center justify-center">
              <ActionBar
                prompt={prompt}
                onAction={sendAction}
                isReachMode={isReachMode}
                setIsReachMode={setIsReachMode}
              />
            </div>
          )}

          {/* My River */}
          <div className="flex items-center justify-center">
            <River discards={gameState?.discards?.[0] || []} />
          </div>

          {/* My Hand Tiles + My Melds on the right */}
          {gameState && (
            <div className="flex items-end justify-center gap-3">
              <PlayerHand
                hand={gameState.my_hand}
                isMyTurn={isMyTurn}
                canDiscard={canDiscard}
                isReachReady={isReachMode}
                riichiDiscards={prompt?.riichi_discards || []}
                selectedTile={selectedTile}
                onTileClick={handleTileClick}
                shanten={gameState.my_shanten}
                waits={gameState.my_waits}
                furiten={gameState.my_furiten}
              />
              <Melds melds={gameState?.melds?.[0] || []} orientation="bottom" />
            </div>
          )}
        </div>
      </main>

      {/* Dramatic Hora Cut-in Banner (Ron / Tsumo) */}
      {horaAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none select-none animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center gap-3 px-12 py-7 rounded-3xl bg-slate-950/90 border-4 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)] backdrop-blur-xl ring-4 ring-amber-500/30">
            <div
              className={`text-6xl font-black tracking-widest ${
                horaAnnouncement.isTsumo
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-[0_4px_16px_rgba(245,158,11,0.8)]'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-500 to-rose-600 drop-shadow-[0_4px_16px_rgba(244,63,94,0.8)]'
              }`}
            >
              {horaAnnouncement.isTsumo ? '쯔모 (ツモ / 自摸) !' : '론 (ロン / 栄和) !'}
            </div>
            <div className="text-xl font-bold text-slate-200 flex items-center gap-2">
              <span className="text-amber-400 font-black text-2xl">
                {horaAnnouncement.winnerName}
              </span>
              <span>화료!</span>
              {horaAnnouncement.yakuLevel && (
                <span className="px-2.5 py-0.5 rounded-lg text-sm font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md">
                  {horaAnnouncement.yakuLevel}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 bg-black/50 px-4 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs font-bold text-slate-400">화료패:</span>
              <div className="ring-2 ring-amber-400 rounded-md shadow-md">
                <MahjongTile tile={horaAnnouncement.pai} size="sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal (Hora / Ryuukyoku) */}
      <ResultModal
        isOpen={!!roundResult}
        result={roundResult}
        gameOver={gameState?.game_over || false}
        onNextKyoku={handleNextKyoku}
        onNewGame={handleNewGame}
      />
    </div>
  )
}

export default App
