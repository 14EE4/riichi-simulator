from __future__ import annotations
from typing import List, Optional, Tuple, Dict, Any
from mahjong.hand_calculating.hand import HandCalculator
from mahjong.hand_calculating.hand_config import HandConfig, OptionalRules
from mahjong.meld import Meld
from mahjong.shanten import Shanten
from mahjong.tile import TilesConverter

from mahjong.constants import EAST, SOUTH, WEST, NORTH

WINDS = [EAST, SOUTH, WEST, NORTH]
INDEX_TO_MJAI = [
    "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m",
    "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p",
    "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s",
    "E", "S", "W", "N", "P", "F", "C",
]

MJAI_TO_INDEX = {tile: i for i, tile in enumerate(INDEX_TO_MJAI)}
# Red dora aliases
MJAI_TO_INDEX["5mr"] = 4
MJAI_TO_INDEX["0m"] = 4
MJAI_TO_INDEX["5pr"] = 13
MJAI_TO_INDEX["0p"] = 13
MJAI_TO_INDEX["5sr"] = 22
MJAI_TO_INDEX["0s"] = 22

def tile_to_136(tile: str, used_indices: set[int]) -> int:
    """Convert a single mjai tile string (e.g. '3m', '5pr', 'E', 'C') to a unique 0..135 index."""
    idx34 = MJAI_TO_INDEX[tile]
    base = idx34 * 4
    # 5mr designated as 16, 5pr as 52, 5sr as 88
    if tile in ("5mr", "0m"):
        target = 16
        if target not in used_indices:
            used_indices.add(target)
            return target
    elif tile in ("5pr", "0p"):
        target = 52
        if target not in used_indices:
            used_indices.add(target)
            return target
    elif tile in ("5sr", "0s"):
        target = 88
        if target not in used_indices:
            used_indices.add(target)
            return target

    for offset in range(4):
        candidate = base + offset
        if candidate not in used_indices:
            used_indices.add(candidate)
            return candidate
    return base

def dora_indicator_to_dora_tile(indicator: str) -> str:
    """Return the dora tile given the dora indicator."""
    if indicator in ("E", "S", "W", "N"):
        order = ["E", "S", "W", "N"]
        return order[(order.index(indicator) + 1) % 4]
    if indicator in ("P", "F", "C"):
        order = ["P", "F", "C"]
        return order[(order.index(indicator) + 1) % 3]

    num = int(indicator[0]) if indicator[0] != "0" else 5
    suit = indicator[-1]
    next_num = 1 if num == 9 else num + 1
    return f"{next_num}{suit}"

def get_riichi_discards(hand_14: List[str]) -> List[str]:
    """Find all tiles in a 14-tile hand that, when discarded, leave the remaining 13 tiles in Tenpai (shanten == 0)."""
    shanten_calc = Shanten()
    valid_discards = []
    seen = set()

    for i, tile in enumerate(hand_14):
        if tile in seen:
            continue
        seen.add(tile)

        sub_hand = hand_14[:i] + hand_14[i+1:]
        tiles_34 = [0] * 34
        for t in sub_hand:
            tiles_34[MJAI_TO_INDEX[t]] += 1

        if shanten_calc.calculate_shanten(tiles_34) == 0:
            valid_discards.append(tile)

    return valid_discards

class MahjongScorer:
    """Calculates official Japanese Riichi Mahjong scores using the python-mahjong library."""

    def __init__(self):
        self.calculator = HandCalculator()
        self.optional_rules = OptionalRules(
            has_open_tanyao=True,
            has_aka_dora=True,
            has_double_yakuman=True,
            renhou_as_yakuman=False,
            has_daisharin=False,
            has_daisharin_other_suits=False,
        )

    def calculate_score(
        self,
        hand_tiles: List[str],
        win_tile: str,
        is_tsumo: bool,
        is_riichi: bool,
        is_dealer: bool,
        dora_indicators: List[str],
        ura_dora_indicators: Optional[List[str]] = None,
        melds: Optional[List[Dict[str, Any]]] = None,
        is_ippatsu: bool = False,
        is_rinshan: bool = False,
        is_chankan: bool = False,
        is_haitei: bool = False,
        is_houtei: bool = False,
        is_double_riichi: bool = False,
        player_wind: str = "E",
        round_wind: str = "E",
    ) -> Dict[str, Any]:
        """Evaluate hand and calculate han, fu, yaku, and point payments."""
        used_indices: set[int] = set()

        tiles_136 = [tile_to_136(t, used_indices) for t in hand_tiles]
        win_tile_136 = tile_to_136(win_tile, used_indices)

        dora_136 = [tile_to_136(d, used_indices) for d in dora_indicators]
        if ura_dora_indicators:
            dora_136 += [tile_to_136(u, used_indices) for u in ura_dora_indicators]

        converted_melds = []
        if melds:
            for m in melds:
                m_type = m["type"]
                m_tiles_136 = [tile_to_136(t, used_indices) for t in m["tiles"]]
                if m_type == "chi":
                    converted_melds.append(Meld(Meld.CHI, m_tiles_136, opened=True))
                elif m_type == "pon":
                    converted_melds.append(Meld(Meld.PON, m_tiles_136, opened=True))
                elif m_type == "daiminkan":
                    converted_melds.append(Meld(Meld.KAN, m_tiles_136, opened=True))
                elif m_type == "ankan":
                    converted_melds.append(Meld(Meld.KAN, m_tiles_136, opened=False))
                elif m_type == "kakan":
                    converted_melds.append(Meld(Meld.CHANKAN, m_tiles_136, opened=True))

        p_wind = WINDS[INDEX_TO_MJAI.index(player_wind) - 27] if player_wind in ("E", "S", "W", "N") else EAST
        r_wind = WINDS[INDEX_TO_MJAI.index(round_wind) - 27] if round_wind in ("E", "S", "W", "N") else EAST

        config = HandConfig(
            is_tsumo=is_tsumo,
            is_riichi=is_riichi,
            is_ippatsu=is_ippatsu,
            is_rinshan=is_rinshan,
            is_chankan=is_chankan,
            is_haitei=is_haitei,
            is_houtei=is_houtei,
            is_daburu_riichi=is_double_riichi,
            player_wind=p_wind,
            round_wind=r_wind,
            options=self.optional_rules,
        )

        result = self.calculator.estimate_hand_value(
            tiles=tiles_136,
            win_tile=win_tile_136,
            melds=converted_melds,
            dora_indicators=dora_136,
            config=config,
        )

        yaku_list = []
        if result.yaku:
            for y in result.yaku:
                han_val = y.han_open if melds else y.han_closed
                yaku_list.append({
                    "name": y.name,
                    "han": han_val,
                    "is_yakuman": y.is_yakuman,
                })

        cost = result.cost or {"main": 0, "additional": 0}

        return {
            "error": result.error,
            "han": result.han,
            "fu": result.fu,
            "cost": cost,
            "yaku": yaku_list,
            "is_dealer": is_dealer,
            "is_tsumo": is_tsumo,
        }
