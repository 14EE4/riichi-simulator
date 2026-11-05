from __future__ import annotations
import asyncio
import json
import logging
import os
import pathlib
import sys
import webbrowser
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import datetime

# Ensure engine path is included
BASE_DIR = pathlib.Path(__file__).parent.parent
sys.path.append(str(pathlib.Path(__file__).parent / "engine"))
from dealer import GameSession

# Setup timestamped file logger + console logger
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
log_filename = LOG_DIR / f"simulator_{timestamp_str}.log"
latest_log = LOG_DIR / "latest.log"

formatter = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)

# File handlers (timestamped and latest)
file_handler = logging.FileHandler(str(log_filename), encoding="utf-8")
file_handler.setFormatter(formatter)
latest_handler = logging.FileHandler(str(latest_log), mode="w", encoding="utf-8")
latest_handler.setFormatter(formatter)

root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(console_handler)
root_logger.addHandler(file_handler)
root_logger.addHandler(latest_handler)

logger = logging.getLogger("riichi-server")
logger.info(f"Log initialized: saving to {log_filename}")

app = FastAPI(title="Riichi Mahjong Simulator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active single-player session
current_session: Optional[GameSession] = None
connected_websockets: set[WebSocket] = set()

async def broadcast_state(payload: dict):
    """Send state payload to all connected clients."""
    data_str = json.dumps(payload)
    dead_sockets = set()
    for ws in list(connected_websockets):
        try:
            await ws.send_text(data_str)
        except Exception:
            dead_sockets.add(ws)
    for ws in dead_sockets:
        if ws in connected_websockets:
            connected_websockets.remove(ws)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global current_session
    await websocket.accept()
    connected_websockets.add(websocket)
    logger.info("Client connected via WebSocket")

    try:
        # If no active game, initialize one with real-time broadcast callback
        if current_session is None:
            current_session = GameSession(broadcast_callback=broadcast_state)
            init_res = await current_session.start_game()
            await websocket.send_text(json.dumps(init_res))
        else:
            # Reconnect: sync callback and send current state
            current_session.broadcast_callback = broadcast_state
            state_payload = {
                "event": "state_sync",
                "state": current_session.get_client_state(),
                "prompt": current_session.waiting_for_user,
                "result": getattr(current_session, "last_result", None),
                "game_over": current_session.game_over,
            }
            await websocket.send_text(json.dumps(state_payload))

        while True:
            text = await websocket.receive_text()
            msg = json.loads(text)
            action = msg.get("action")
            data = msg.get("data", {})

            if action == "start_game":
                current_session = GameSession(broadcast_callback=broadcast_state)
                res = await current_session.start_game()
                await broadcast_state(res)

            elif action == "next_kyoku":
                if current_session:
                    res = await current_session.start_next_kyoku()
                    await broadcast_state(res)

            elif action in ("discard", "tsumo_agari", "ron_agari", "pon", "chi", "pass"):
                if current_session:
                    res = await current_session.handle_user_response(action, data)
                    await broadcast_state(res)

    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)

# Serve built frontend if exists
frontend_dist = pathlib.Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.is_dir():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(frontend_dist / "index.html"))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Riichi Mahjong Simulator on http://localhost:8000")
    webbrowser.open("http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
