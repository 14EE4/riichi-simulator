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
    // Connect to local backend (fallback to port 8000 if vite dev server on 5173)
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
      // Auto reconnect after 2 seconds
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
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-2 bg-slate-950/70 border-b border-white/5 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <h1 className="text-base font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
            Riichi Mahjong Simulator
          </h1>
          <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded bg-white/5 border border-white/5">
            vs Mortal AI x3
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleNewGame}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            새 게임
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">연결됨</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-500">연결 끊김</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Mahjong Mat (Table) */}
      <main className="relative flex-1 flex flex-col items-center justify-between p-4 overflow-hidden">
        {/* Top: Mortal 2 (Toimen) */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <OpponentHand tileCount={13} />
            <Melds melds={gameState?.melds?.[2] || []} />
          </div>
          <River discards={gameState?.discards?.[2] || []} />
        </div>

        {/* Middle Row: Left (Mortal 3) | CenterPanel | Right (Mortal 1) */}
        <div className="flex w-full items-center justify-between px-8">
          {/* Left: Mortal 3 (Kamicha) */}
          <div className="flex items-center gap-3">
            <OpponentHand tileCount={13} vertical={true} />
            <div className="flex flex-col items-center gap-2">
              <River discards={gameState?.discards?.[3] || []} />
              <Melds melds={gameState?.melds?.[3] || []} />
            </div>
          </div>

          {/* Center Info Panel */}
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

          {/* Right: Mortal 1 (Shimocha) */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              <River discards={gameState?.discards?.[1] || []} />
              <Melds melds={gameState?.melds?.[1] || []} />
            </div>
            <OpponentHand tileCount={13} vertical={true} />
          </div>
        </div>

        {/* Bottom: Player (You) Hand & River & Action Bar */}
        <div className="flex flex-col items-center gap-2 w-full">
          {/* Action Bar (Chi/Pon/Kan/Riichi/Ron/Tsumo) */}
          <div className="min-h-[48px] flex items-center justify-center">
            <ActionBar
              prompt={prompt}
              onAction={sendAction}
              isReachMode={isReachMode}
              setIsReachMode={setIsReachMode}
            />
          </div>

          {/* My River */}
          <div className="flex items-center gap-4">
            <River discards={gameState?.discards?.[0] || []} />
            <Melds melds={gameState?.melds?.[0] || []} />
          </div>

          {/* My Hand Tiles */}
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
