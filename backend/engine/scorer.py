from __future__ import annotations
from typing import List, Optional, Tuple, Dict, Any
from mahjong.hand_calculating.hand import HandCalculator
from mahjong.hand_calculating.hand_config import HandConfig, OptionalRules
from mahjong.meld import Meld
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

    suit = indicator[-1]
    num = 5 if indicator.startswith("5") else int(indicator[0])
    dora_num = 1 if num == 9 else num + 1
    return f"{dora_num}{suit}"

class MahjongScorer:
    def __init__(self):
        self.calculator = HandCalculator()
        self.optional_rules = OptionalRules(
            has_open_tanyao=True,
            has_aka_dora=True,
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
        is_ippatsu: bool = False,
        is_rinshan: bool = False,
        is_chankan: bool = False,
        is_haitei: bool = False,
        is_houtei: bool = False,
        is_double_riichi: bool = False,
        round_wind: int = 27,  # 27: East, 28: South
        seat_wind: int = 27,   # 27: East, 28: South, 29: West, 30: North
        melds: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        used_indices: set[int] = set()

        # Ensure hand_tiles contains the winning tile (14 tiles total for menzen)
        all_tiles = list(hand_tiles)
        if win_tile not in all_tiles:
            all_tiles.append(win_tile)

        used_indices: set[int] = set()
        tiles_136 = []
        win_tile_136 = None
        for t in all_tiles:
            idx = tile_to_136(t, used_indices)
            tiles_136.append(idx)
            if t == win_tile and win_tile_136 is None:
                win_tile_136 = idx

        if win_tile_136 is None:
            win_tile_136 = tiles_136[-1]

        # Convert dora indicators to dora 136
        dora_136 = []
        for ind in dora_indicators:
            dora_tile = dora_indicator_to_dora_tile(ind)
            dora_136.append(tile_to_136(dora_tile, set()))

        ura_136 = []
        if is_riichi and ura_dora_indicators:
            for ind in ura_dora_indicators:
                dora_tile = dora_indicator_to_dora_tile(ind)
                ura_136.append(tile_to_136(dora_tile, set()))

        # Parse melds if any
        converted_melds = []
        if melds:
            for m in melds:
                m_type = m.get("type")
                m_tiles = [tile_to_136(t, used_indices) for t in m.get("tiles", [])]
                if m_type == "chi":
                    converted_melds.append(Meld(meld_type=Meld.CHI, tiles=m_tiles))
                elif m_type == "pon":
                    converted_melds.append(Meld(meld_type=Meld.PON, tiles=m_tiles))
                elif m_type in ("daiminkan", "kakan", "ankan"):
                    converted_melds.append(Meld(
                        meld_type=Meld.KAN,
                        tiles=m_tiles,
                        opened=(m_type != "ankan")
                    ))

        # Dealer is EAST
        p_wind = EAST if is_dealer else seat_wind
        r_wind = round_wind

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
