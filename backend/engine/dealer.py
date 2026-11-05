from __future__ import annotations
import random
import json
import logging
from typing import List, Dict, Any, Optional, Tuple

import _libriichi_loader
_libriichi_loader.load()

from libriichi.state import PlayerState, ActionCandidate
from mortal_agent import MortalAgent, create_mortal_agents
from scorer import MahjongScorer, INDEX_TO_MJAI

def parse_waits_mask(waits_mask: Any) -> List[str]:
    """Convert libriichi 34-element boolean waits mask to mjai tile strings."""
    if not waits_mask:
        return []
    res = []
    for idx, is_wait in enumerate(waits_mask):
        if is_wait and idx < len(INDEX_TO_MJAI):
            res.append(INDEX_TO_MJAI[idx])
    return res

logger = logging.getLogger(__name__)

# Complete 136 mahjong tile set in mjai notation
ALL_TILES_136 = (
    # Manzu (1m-9m x4, one 5m is red 5mr)
    ["1m", "1m", "1m", "1m", "2m", "2m", "2m", "2m", "3m", "3m", "3m", "3m",
     "4m", "4m", "4m", "4m", "5mr", "5m", "5m", "5m", "6m", "6m", "6m", "6m",
     "7m", "7m", "7m", "7m", "8m", "8m", "8m", "8m", "9m", "9m", "9m", "9m"] +
    # Pinzu (1p-9p x4, one 5p is red 5pr)
    ["1p", "1p", "1p", "1p", "2p", "2p", "2p", "2p", "3p", "3p", "3p", "3p",
     "4p", "4p", "4p", "4p", "5pr", "5p", "5p", "5p", "6p", "6p", "6p", "6p",
     "7p", "7p", "7p", "7p", "8p", "8p", "8p", "8p", "9p", "9p", "9p", "9p"] +
    # Souzu (1s-9s x4, one 5s is red 5sr)
    ["1s", "1s", "1s", "1s", "2s", "2s", "2s", "2s", "3s", "3s", "3s", "3s",
     "4s", "4s", "4s", "4s", "5sr", "5s", "5s", "5s", "6s", "6s", "6s", "6s",
     "7s", "7s", "7s", "7s", "8s", "8s", "8s", "8s", "9s", "9s", "9s", "9s"] +
    # Jihai: E (East), S (South), W (West), N (North), P (Haku), F (Hatsu), C (Chun)
    ["E", "E", "E", "E", "S", "S", "S", "S", "W", "W", "W", "W", "N", "N", "N", "N",
     "P", "P", "P", "P", "F", "F", "F", "F", "C", "C", "C", "C"]
)

BAKAZE_LIST = ["E", "S"]  # East round, South round

def normalize_tile(tile: str) -> str:
    """Normalize aka tile for sorting/comparing: '5mr' -> '5m'."""
    if tile in ("5mr", "0m"): return "5m"
    if tile in ("5pr", "0p"): return "5p"
    if tile in ("5sr", "0s"): return "5s"
    return tile

def sort_tiles(tiles: List[str]) -> List[str]:
    """Sort tiles in standard Japanese mahjong order (m, p, s, z)."""
    suit_order = {"m": 0, "p": 1, "s": 2, "z": 3}
    jihai_order = {"E": 0, "S": 1, "W": 2, "N": 3, "P": 4, "F": 5, "C": 6}

    def key(t: str):
        if t in jihai_order:
            return (3, jihai_order[t], 0)
        suit = t[-1]
        norm = normalize_tile(t)
        num = int(norm[0])
        is_aka = 1 if t.endswith("r") or t.startswith("0") else 0
        return (suit_order.get(suit, 4), num, is_aka)

    return sorted(tiles, key=key)

class GameSession:
    """Orchestrates an entire single-player Japanese Riichi Mahjong game (1 human vs 3 Mortal bots)."""

    def __init__(self, names: Optional[List[str]] = None):
        self.names = names or ["You", "Mortal East", "Mortal North", "Mortal West"]
        self.scores = [25000, 25000, 25000, 25000]
        self.bakaze_idx = 0  # 0: East, 1: South
        self.kyoku = 1       # 1..4
        self.honba = 0
        self.kyoutaku = 0
        self.oya = 0         # Seat 0..3

        self.scorer = MahjongScorer()
        self.mortal_agents = create_mortal_agents()
        self.player_states: List[PlayerState] = [PlayerState(i) for i in range(4)]

        # Current Kyoku (hand) runtime state
        self.wall: List[str] = []
        self.dead_wall: List[str] = []
        self.dora_markers: List[str] = []
        self.ura_markers: List[str] = []
        self.hands: List[List[str]] = [[], [], [], []]
        self.discards: List[List[Dict[str, Any]]] = [[], [], [], []]
        self.melds: List[List[Dict[str, Any]]] = [[], [], [], []]
        self.riichi_declared = [False] * 4
        self.riichi_accepted = [False] * 4
        self.ippatsu = [False] * 4

        self.current_turn = 0
        self.last_discard: Optional[Dict[str, Any]] = None
        self.last_tsumo: Optional[str] = None
        self.game_over = False

        # Pending human prompt if waiting for user input
        self.waiting_for_user: Optional[Dict[str, Any]] = None

    def dispatch_public_event(self, event: Dict[str, Any], skip_agent: Optional[int] = None):
        """Broadcast an event visible to all players identically."""
        line = json.dumps(event)
        for i in range(4):
            self.player_states[i].update(line)
        for seat, agent in self.mortal_agents.items():
            if seat != skip_agent:
                agent.react(line, can_act=False)

    def start_game(self):
        """Initialize the entire game session."""
        self.scores = [25000, 25000, 25000, 25000]
        self.bakaze_idx = 0
        self.kyoku = 1
        self.honba = 0
        self.kyoutaku = 0
        self.oya = 0
        self.game_over = False

        for agent in self.mortal_agents.values():
            agent.reset()
        self.player_states = [PlayerState(i) for i in range(4)]

        # Each seat receives start_game with their own ID
        for i in range(4):
            ev = {"type": "start_game", "names": self.names, "id": i}
            line = json.dumps(ev)
            self.player_states[i].update(line)
            if i in self.mortal_agents:
                self.mortal_agents[i].react(line, can_act=False)

        return self.start_next_kyoku()

    def start_next_kyoku(self) -> Dict[str, Any]:
        """Deal a new hand (Kyoku) and prepare the wall."""
        self.riichi_declared = [False] * 4
        self.riichi_accepted = [False] * 4
        self.ippatsu = [False] * 4
        self.discards = [[], [], [], []]
        self.melds = [[], [], [], []]
        self.last_discard = None
        self.last_tsumo = None
        self.waiting_for_user = None

        # 1. Shuffle full 136-tile wall
        wall = list(ALL_TILES_136)
        random.shuffle(wall)

        # 2. Separate Dead wall (14 tiles: 4 rinshan, 5 dora, 5 uradora)
        self.dead_wall = wall[:14]
        self.wall = wall[14:]  # 122 tiles

        # 5 dora indicators (revealed sequentially on kan)
        dora_indicators_all = self.dead_wall[4:9]
        self.ura_markers = self.dead_wall[9:14]
        self.dora_markers = [dora_indicators_all[0]]

        # 3. Deal 13 tiles to each player
        self.hands = [[], [], [], []]
        for _ in range(13):
            for i in range(4):
                self.hands[i].append(self.wall.pop(0))

        for i in range(4):
            self.hands[i] = sort_tiles(self.hands[i])

        bakaze = BAKAZE_LIST[self.bakaze_idx]

        # 4. Dispatch start_kyoku per seat with hidden opponent hands
        for seat in range(4):
            tehais = [["?"] * 13 for _ in range(4)]
            tehais[seat] = list(self.hands[seat])

            ev = {
                "type": "start_kyoku",
                "bakaze": bakaze,
                "kyoku": self.kyoku,
                "honba": self.honba,
                "kyotaku": self.kyoutaku,
                "oya": self.oya,
                "scores": list(self.scores),
                "dora_marker": self.dora_markers[0],
                "tehais": tehais,
            }
            line = json.dumps(ev)
            self.player_states[seat].update(line)
            if seat in self.mortal_agents:
                self.mortal_agents[seat].react(line, can_act=False)

        self.current_turn = self.oya
        return self.draw_tile(self.oya)

    def draw_tile(self, actor: int) -> Dict[str, Any]:
        """Actor draws a tile from the wall."""
        if len(self.wall) == 0:
            return self.handle_ryuukyoku()

        drawn = self.wall.pop(0)
        self.hands[actor].append(drawn)
        self.last_tsumo = drawn
        self.current_turn = actor

        # Dispatch tsumo event: visible tile only to actor, "?" to opponents
        exact_tsumo = {"type": "tsumo", "actor": actor, "pai": drawn}
        hidden_tsumo = {"type": "tsumo", "actor": actor, "pai": "?"}

        for seat in range(4):
            ev = exact_tsumo if seat == actor else hidden_tsumo
            line = json.dumps(ev)
            if seat == actor:
                cand = self.player_states[actor].update(line)
            else:
                self.player_states[seat].update(line)
                if seat in self.mortal_agents:
                    self.mortal_agents[seat].react(line, can_act=False)

        # Check if human turn
        if actor == 0:
            actions = ["discard"]
            if cand.can_tsumo_agari:
                actions.append("tsumo_agari")
            if cand.can_riichi and not self.riichi_declared[0]:
                actions.append("riichi")
            if cand.can_ankan:
                actions.append("ankan")
            if cand.can_kakan:
                actions.append("kakan")

            self.waiting_for_user = {
                "type": "turn_action",
                "actor": 0,
                "actions": actions,
                "tsumo": drawn,
                "shanten": self.player_states[0].shanten,
                "waits": parse_waits_mask(self.player_states[0].waits),
                "at_furiten": self.player_states[0].at_furiten,
            }
            return {
                "event": "user_action_required",
                "state": self.get_client_state(),
                "prompt": self.waiting_for_user,
            }

        # Actor is AI (Mortal)
        ai_resp = self.mortal_agents[actor].react(exact_tsumo, can_act=True)
        if not ai_resp:
            # Fallback: simple tsumogiri
            return self.execute_discard(actor, drawn, tsumogiri=True)

        resp_type = ai_resp.get("type")
        if resp_type == "hora":
            return self.handle_hora(actor, target_actor=actor, is_tsumo=True)
        elif resp_type == "reach":
            self.riichi_declared[actor] = True
            # AI will discard next
            next_resp = self.mortal_agents[actor].react(ai_resp, can_act=True)
            discard_tile = next_resp.get("pai", drawn) if next_resp else drawn
            return self.execute_discard(actor, discard_tile, tsumogiri=(discard_tile == drawn), is_reach=True)
        elif resp_type == "dahai":
            discard_tile = ai_resp.get("pai", drawn)
            tsumogiri = ai_resp.get("tsumogiri", discard_tile == drawn)
            return self.execute_discard(actor, discard_tile, tsumogiri=tsumogiri)
        else:
            return self.execute_discard(actor, drawn, tsumogiri=True)

    def execute_discard(
        self,
        actor: int,
        tile: str,
        tsumogiri: bool = False,
        is_reach: bool = False,
    ) -> Dict[str, Any]:
        """Actor discards a tile."""
        if tile in self.hands[actor]:
            self.hands[actor].remove(tile)
        elif tsumogiri and len(self.hands[actor]) > 0:
            tile = self.hands[actor].pop()

        self.hands[actor] = sort_tiles(self.hands[actor])

        if is_reach:
            self.riichi_declared[actor] = True
            reach_event = {"type": "reach", "actor": actor}
            self.dispatch_public_event(reach_event)

        self.discards[actor].append({
            "tile": tile,
            "tsumogiri": tsumogiri,
            "riichi": is_reach,
        })
        self.last_discard = {"actor": actor, "tile": tile}

        dahai_event = {
            "type": "dahai",
            "actor": actor,
            "pai": tile,
            "tsumogiri": tsumogiri,
        }
        line = json.dumps(dahai_event)

        # 1. Update all 4 player_states exactly once
        cands: Dict[int, ActionCandidate] = {}
        for seat in range(4):
            cand = self.player_states[seat].update(line)
            if seat != actor:
                cands[seat] = cand

        # 2. Update the discarder bot without reacting
        if actor in self.mortal_agents:
            self.mortal_agents[actor].react(line, can_act=False)

        # 3. Check if human player (seat 0) can react
        if 0 in cands and cands[0].can_act:
            human_cand = cands[0]
            actions = []
            options = {}
            if human_cand.can_ron_agari:
                actions.append("ron_agari")
            if human_cand.can_pon:
                actions.append("pon")
            if human_cand.can_daiminkan:
                actions.append("daiminkan")
            if human_cand.can_chi and 0 == (actor + 1) % 4:
                actions.append("chi")
                options["chi_patterns"] = []
                num = int(tile[0]) if tile[0] != "0" else 5
                suit = tile[-1]
                if suit in ("m", "p", "s"):
                    hand_norms = [normalize_tile(t) for t in self.hands[0]]
                    for p1_n, p2_n in [(num-2, num-1), (num-1, num+1), (num+1, num+2)]:
                        t1, t2 = f"{p1_n}{suit}", f"{p2_n}{suit}"
                        if t1 in hand_norms and t2 in hand_norms:
                            options["chi_patterns"].append([t1, t2])

            if actions:
                self.waiting_for_user = {
                    "type": "call_action",
                    "actor": 0,
                    "target_actor": actor,
                    "target_tile": tile,
                    "actions": actions,
                    "options": options,
                }
                return {
                    "event": "user_call_required",
                    "state": self.get_client_state(),
                    "prompt": self.waiting_for_user,
                }

        # 4. Human cannot call; query AI players exactly once
        return self.resolve_ai_reactions(actor, tile, cands)

    def resolve_ai_reactions(
        self,
        discarder: int,
        tile: str,
        cands: Dict[int, ActionCandidate],
    ) -> Dict[str, Any]:
        """Collect reactions from AI agents on the discard (exactly 1 call per bot)."""
        dahai_line = json.dumps({"type": "dahai", "actor": discarder, "pai": tile, "tsumogiri": False})
        ai_responses = {}

        for seat in sorted(self.mortal_agents.keys()):
            if seat == discarder:
                continue
            can_act = cands[seat].can_act if seat in cands else False
            resp = self.mortal_agents[seat].react(dahai_line, can_act=can_act)
            if resp and resp.get("type") != "none":
                ai_responses[seat] = resp

        # Priority 1: Ron (Hora)
        for seat, resp in ai_responses.items():
            if resp.get("type") == "hora":
                return self.handle_hora(seat, target_actor=discarder, is_tsumo=False)

        # Priority 2: Pon / Kan
        for seat, resp in ai_responses.items():
            resp_type = resp.get("type")
            consumed = resp.get("consumed", [])
            if resp_type == "pon":
                return self.execute_pon(seat, discarder, tile, consumed)
            elif resp_type == "daiminkan":
                return self.execute_kan(seat, discarder, tile, consumed)

        # Priority 3: Chi (shimocha only)
        for seat, resp in ai_responses.items():
            if resp.get("type") == "chi" and seat == (discarder + 1) % 4:
                consumed = resp.get("consumed", [])
                return self.execute_chi(seat, discarder, tile, consumed)

        # No calls made, advance to next player
        next_actor = (discarder + 1) % 4
        return self.draw_tile(next_actor)

    def execute_pon(self, actor: int, target_actor: int, tile: str, consumed: List[str]) -> Dict[str, Any]:
        """Execute a Pon call."""
        for t in consumed:
            if t in self.hands[actor]:
                self.hands[actor].remove(t)
        meld = {"type": "pon", "tiles": sort_tiles(consumed + [tile]), "from": target_actor}
        self.melds[actor].append(meld)

        pon_event = {"type": "pon", "actor": actor, "target": target_actor, "pai": tile, "consumed": consumed}
        self.dispatch_public_event(pon_event, skip_agent=actor)
        self.current_turn = actor

        # Discard turn after calling
        if actor == 0:
            self.waiting_for_user = {
                "type": "turn_action",
                "actor": 0,
                "actions": ["discard"],
                "shanten": self.player_states[0].shanten,
                "waits": parse_waits_mask(self.player_states[0].waits),
            }
            return {
                "event": "user_action_required",
                "state": self.get_client_state(),
                "prompt": self.waiting_for_user,
            }
        else:
            ai_resp = self.mortal_agents[actor].react(pon_event, can_act=True)
            discard_tile = ai_resp.get("pai", self.hands[actor][-1]) if ai_resp else self.hands[actor][-1]
            return self.execute_discard(actor, discard_tile, tsumogiri=False)

    def execute_chi(self, actor: int, target_actor: int, tile: str, consumed: List[str]) -> Dict[str, Any]:
        """Execute a Chi call."""
        for t in consumed:
            if t in self.hands[actor]:
                self.hands[actor].remove(t)
        meld = {"type": "chi", "tiles": sort_tiles(consumed + [tile]), "from": target_actor}
        self.melds[actor].append(meld)

        chi_event = {"type": "chi", "actor": actor, "target": target_actor, "pai": tile, "consumed": consumed}
        self.dispatch_public_event(chi_event, skip_agent=actor)
        self.current_turn = actor

        if actor == 0:
            self.waiting_for_user = {
                "type": "turn_action",
                "actor": 0,
                "actions": ["discard"],
                "shanten": self.player_states[0].shanten,
                "waits": parse_waits_mask(self.player_states[0].waits),
            }
            return {
                "event": "user_action_required",
                "state": self.get_client_state(),
                "prompt": self.waiting_for_user,
            }
        else:
            ai_resp = self.mortal_agents[actor].react(chi_event, can_act=True)
            discard_tile = ai_resp.get("pai", self.hands[actor][-1]) if ai_resp else self.hands[actor][-1]
            return self.execute_discard(actor, discard_tile, tsumogiri=False)

    def execute_kan(self, actor: int, target_actor: int, tile: str, consumed: List[str]) -> Dict[str, Any]:
        """Execute a Daiminkan call."""
        for t in consumed:
            if t in self.hands[actor]:
                self.hands[actor].remove(t)
        meld = {"type": "daiminkan", "tiles": consumed + [tile], "from": target_actor}
        self.melds[actor].append(meld)

        kan_event = {"type": "daiminkan", "actor": actor, "target": target_actor, "pai": tile, "consumed": consumed}
        self.dispatch_public_event(kan_event)

        # Open new dora indicator from dead wall
        if len(self.dora_markers) < 5:
            dora_indicators_all = self.dead_wall[4:9]
            new_dora = dora_indicators_all[len(self.dora_markers)]
            self.dora_markers.append(new_dora)
            self.dispatch_public_event({"type": "dora", "dora_marker": new_dora})

        # Draw replacement tile from dead wall (rinshan)
        if len(self.dead_wall) > 0:
            rinshan_tile = self.dead_wall.pop(0)
            self.hands[actor].append(rinshan_tile)
            return self.draw_tile(actor)

        return self.draw_tile(actor)

    def handle_user_response(self, action: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process action submitted by the human player."""
        self.waiting_for_user = None

        if action == "discard":
            tile = data.get("tile")
            is_reach = data.get("is_reach", False)
            tsumogiri = (tile == self.last_tsumo)
            return self.execute_discard(0, tile, tsumogiri=tsumogiri, is_reach=is_reach)

        elif action == "tsumo_agari":
            return self.handle_hora(0, target_actor=0, is_tsumo=True)

        elif action == "ron_agari":
            target = self.last_discard["actor"]
            return self.handle_hora(0, target_actor=target, is_tsumo=False)

        elif action == "pon":
            target = self.last_discard["actor"]
            tile = self.last_discard["tile"]
            consumed = data.get("consumed", [normalize_tile(tile), normalize_tile(tile)])
            return self.execute_pon(0, target, tile, consumed)

        elif action == "chi":
            target = self.last_discard["actor"]
            tile = self.last_discard["tile"]
            consumed = data.get("consumed", [])
            return self.execute_chi(0, target, tile, consumed)

        elif action == "pass":
            # Pass on call; continue to resolve AI reactions or advance turn
            target = self.last_discard["actor"]
            tile = self.last_discard["tile"]
            # Remaining AI cands
            cands = {s: self.player_states[s] for s in range(1, 4) if s != target}
            return self.resolve_ai_reactions(target, tile, cands)

        return {"event": "error", "message": f"Unknown action: {action}"}

    def handle_hora(self, winner: int, target_actor: int, is_tsumo: bool) -> Dict[str, Any]:
        """Handle win settlement (Score, Han, Fu, Yaku, point transfers)."""
        win_tile = self.last_tsumo if is_tsumo else self.last_discard["tile"]
        is_dealer = (winner == self.oya)
        is_riichi = self.riichi_declared[winner]

        score_res = self.scorer.calculate_score(
            hand_tiles=self.hands[winner],
            win_tile=win_tile,
            is_tsumo=is_tsumo,
            is_riichi=is_riichi,
            is_dealer=is_dealer,
            dora_indicators=self.dora_markers,
            ura_dora_indicators=self.ura_markers if is_riichi else None,
            melds=self.melds[winner],
        )

        cost = score_res["cost"]
        total_delta = [0, 0, 0, 0]

        if is_tsumo:
            if is_dealer:
                each_pay = cost["main"] + (self.honba * 100)
                for s in range(4):
                    if s != winner:
                        total_delta[s] -= each_pay
                        total_delta[winner] += each_pay
            else:
                dealer_pay = cost["main"] + (self.honba * 100)
                other_pay = cost["additional"] + (self.honba * 100)
                for s in range(4):
                    if s != winner:
                        pay = dealer_pay if s == self.oya else other_pay
                        total_delta[s] -= pay
                        total_delta[winner] += pay
        else:
            loser_pay = cost["main"] + (self.honba * 300)
            total_delta[target_actor] -= loser_pay
            total_delta[winner] += loser_pay

        # Award riichi deposits
        total_delta[winner] += self.kyoutaku * 1000
        self.kyoutaku = 0

        # Apply score delta
        for s in range(4):
            self.scores[s] += total_delta[s]

        hora_event = {
            "type": "hora",
            "actor": winner,
            "target": target_actor,
            "pai": win_tile,
            "score_info": score_res,
            "score_delta": total_delta,
            "new_scores": list(self.scores),
            "winner_hand": list(self.hands[winner]),
            "winner_name": self.names[winner],
        }

        # Next kyoku determination
        if winner == self.oya:
            self.honba += 1  # Dealer repeats (Renchan)
        else:
            self.honba = 0
            self.oya = (self.oya + 1) % 4
            if self.oya == 0:
                self.bakaze_idx += 1

        if self.bakaze_idx >= 2:
            self.game_over = True

        return {
            "event": "hora",
            "state": self.get_client_state(),
            "result": hora_event,
            "game_over": self.game_over,
        }

    def handle_ryuukyoku(self) -> Dict[str, Any]:
        """Handle exhaustive draw (wall exhausted)."""
        tenpai_list = []
        for s in range(4):
            is_tenpai = (self.player_states[s].shanten == 0)
            tenpai_list.append(is_tenpai)

        # 3000 points nagashi payment
        num_tenpai = sum(tenpai_list)
        total_delta = [0, 0, 0, 0]
        if 1 <= num_tenpai <= 3:
            pay = 3000 // (4 - num_tenpai)
            recv = 3000 // num_tenpai
            for s in range(4):
                if tenpai_list[s]:
                    total_delta[s] += recv
                    self.scores[s] += recv
                else:
                    total_delta[s] -= pay
                    self.scores[s] -= pay

        # Renchan if dealer is tenpai
        dealer_tenpai = tenpai_list[self.oya]
        self.honba += 1
        if not dealer_tenpai:
            self.oya = (self.oya + 1) % 4
            if self.oya == 0:
                self.bakaze_idx += 1

        if self.bakaze_idx >= 2:
            self.game_over = True

        ryuukyoku_event = {
            "type": "ryuukyoku",
            "tenpai": tenpai_list,
            "score_delta": total_delta,
            "new_scores": list(self.scores),
        }

        return {
            "event": "ryuukyoku",
            "state": self.get_client_state(),
            "result": ryuukyoku_event,
            "game_over": self.game_over,
        }

    def get_client_state(self) -> Dict[str, Any]:
        """Serialize complete game board view for the frontend UI."""
        return {
            "names": self.names,
            "scores": self.scores,
            "bakaze": BAKAZE_LIST[self.bakaze_idx] if self.bakaze_idx < 2 else "E",
            "kyoku": self.kyoku,
            "honba": self.honba,
            "kyoutaku": self.kyoutaku,
            "oya": self.oya,
            "dora_markers": self.dora_markers,
            "tiles_left": len(self.wall),
            "current_turn": self.current_turn,
            "my_hand": sort_tiles(self.hands[0]),
            "my_shanten": self.player_states[0].shanten,
            "my_waits": parse_waits_mask(self.player_states[0].waits),
            "my_furiten": self.player_states[0].at_furiten,
            "discards": self.discards,
            "melds": self.melds,
            "riichi_declared": self.riichi_declared,
            "last_discard": self.last_discard,
            "game_over": self.game_over,
        }
