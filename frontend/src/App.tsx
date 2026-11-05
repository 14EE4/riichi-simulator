import React, { useEffect, useState, useRef } from 'react'
import { River, DiscardItem } from './components/River'
import { CenterPanel } from './components/CenterPanel'
import { PlayerHand } from './components/PlayerHand'
import { OpponentHand } from './components/OpponentHand'
import { Melds, MeldItem } from './components/Melds'
import { ActionBar, PromptAction } from './components/ActionBar'
import { ResultModal } from './components/ResultModal'
import { Wifi, WifiOff, RotateCcw } from 'lucide-react'

interface GameState {
  names: string[]
  scores: number[]
  bakaze: string
  kyoku: number
  honba: number
  kyoutaku: number
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

  const socketRef = useRef<WebSocket | null>(null)

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

        if (data.event === 'hora' || data.event === 'ryuukyoku') {
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
    sendAction('start_game')
  }

  const handleNextKyoku = () => {
    setRoundResult(null)
    sendAction('next_kyoku')
  }

  const isMyTurn = gameState?.current_turn === 0
  const canDiscard = isMyTurn && !!prompt?.actions?.includes('discard')

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
        {/* Top: Mortal 2 (Toimen - North) */}
        {/* Hand is at outer edge, river is in front of hand facing center */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <OpponentHand tileCount={13} />
            <Melds melds={gameState?.melds?.[2] || []} />
          </div>
          <River discards={gameState?.discards?.[2] || []} className="rotate-180 origin-center" />
        </div>

        {/* Middle Row: Left (Kamicha) | CenterPanel | Right (Shimocha) */}
        <div className="flex w-full items-center justify-between px-4 max-w-7xl shrink-0 my-auto">
          {/* Left: Mortal 3 (Kamicha - West) */}
          <div className="flex items-center gap-2">
            <OpponentHand tileCount={13} vertical={true} />
            <div className="flex flex-col items-center gap-1">
              <Melds melds={gameState?.melds?.[3] || []} />
              <River discards={gameState?.discards?.[3] || []} className="rotate-90 origin-center" />
            </div>
          </div>

          {/* Center Info Panel (Authentic Mahjong Table Display with Per-Seat Rotation) */}
          {gameState && (
            <CenterPanel
              bakaze={gameState.bakaze}
              kyoku={gameState.kyoku}
              honba={gameState.honba}
              kyotaku={gameState.kyoutaku}
              oya={gameState.oya}
              doraMarkers={gameState.dora_markers}
              tilesLeft={gameState.tiles_left}
              scores={gameState.scores}
              names={gameState.names}
              currentTurn={gameState.current_turn}
              riichiDeclared={gameState.riichi_declared}
            />
          )}

          {/* Right: Mortal 1 (Shimocha - East) */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <River discards={gameState?.discards?.[1] || []} className="-rotate-90 origin-center" />
              <Melds melds={gameState?.melds?.[1] || []} />
            </div>
            <OpponentHand tileCount={13} vertical={true} />
          </div>
        </div>

        {/* Bottom: Player (You - South) */}
        <div className="relative flex flex-col items-center gap-1 w-full shrink-0 pb-1">
          {/* Floating Action Bar (Appears right above player area when an action prompt is active) */}
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

          {/* My River & Melds */}
          <div className="flex items-center gap-3">
            <River discards={gameState?.discards?.[0] || []} />
            <Melds melds={gameState?.melds?.[0] || []} />
          </div>

          {/* My Hand Tiles (Guaranteed visible at bottom) */}
          {gameState && (
            <PlayerHand
              hand={gameState.my_hand}
              isMyTurn={isMyTurn}
              canDiscard={canDiscard}
              isReachReady={isReachMode}
              selectedTile={selectedTile}
              onTileClick={handleTileClick}
              shanten={gameState.my_shanten}
              waits={gameState.my_waits}
              furiten={gameState.my_furiten}
            />
          )}
        </div>
      </main>

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
