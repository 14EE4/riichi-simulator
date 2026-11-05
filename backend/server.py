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

# Ensure engine path is included
sys.path.append(str(pathlib.Path(__file__).parent / "engine"))
from dealer import GameSession

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("riichi-server")

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
    for ws in connected_websockets:
        try:
            await ws.send_text(data_str)
        except Exception:
            dead_sockets.add(ws)
    for ws in dead_sockets:
        connected_websockets.remove(ws)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global current_session
    await websocket.accept()
    connected_websockets.add(websocket)
    logger.info("Client connected via WebSocket")

    try:
        # If no active game, initialize one
        if current_session is None:
            current_session = GameSession()
            init_res = current_session.start_game()
            await websocket.send_text(json.dumps(init_res))
        else:
            # Send current state
            state_payload = {
                "event": "state_sync",
                "state": current_session.get_client_state(),
                "prompt": current_session.waiting_for_user,
            }
            await websocket.send_text(json.dumps(state_payload))

        while True:
            text = await websocket.receive_text()
            msg = json.loads(text)
            action = msg.get("action")
            data = msg.get("data", {})

            if action == "start_game":
                current_session = GameSession()
                res = current_session.start_game()
                await broadcast_state(res)

            elif action == "next_kyoku":
                if current_session:
                    res = current_session.start_next_kyoku()
                    await broadcast_state(res)

            elif action in ("discard", "tsumo_agari", "ron_agari", "pon", "chi", "pass"):
                if current_session:
                    res = current_session.handle_user_response(action, data)
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
    async def serve_frontend(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")

def main():
    import uvicorn
    port = 8000
    logger.info(f"Starting Riichi Mahjong Simulator on http://localhost:{port}")
    webbrowser.open(f"http://localhost:{port}")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")

if __name__ == "__main__":
    main()
