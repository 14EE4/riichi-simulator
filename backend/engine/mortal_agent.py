from __future__ import annotations
import json
import logging
from typing import Optional, Any
from model import _build_engine, Bot, MortalEngine

logger = logging.getLogger(__name__)

class MortalAgent:
    """Represents a Mortal AI player using a shared MortalEngine."""

    def __init__(self, engine: MortalEngine, player_id: int):
        self.engine = engine
        self.player_id = player_id
        self.bot = Bot(engine, player_id)

    def reset(self):
        """Reset the internal libriichi Bot state for a new game."""
        self.bot = Bot(self.engine, self.player_id)

    def react(self, event: dict | str, can_act: bool = True) -> Optional[dict]:
        """Send a single mjai event to this bot and get its reaction if any."""
        line = json.dumps(event) if isinstance(event, dict) else event
        resp = self.bot.react(line, can_act=can_act)
        if not resp:
            return None
        try:
            return json.loads(resp)
        except Exception as e:
            logger.error(f"Failed to parse bot reaction: {resp}, error: {e}")
            return None

def create_mortal_agents(engine: Optional[MortalEngine] = None) -> dict[int, MortalAgent]:
    """Create 3 Mortal agents for seats 1, 2, 3 (human is seat 0)."""
    if engine is None:
        engine = _build_engine()
    return {
        1: MortalAgent(engine, 1),
        2: MortalAgent(engine, 2),
        3: MortalAgent(engine, 3),
    }
