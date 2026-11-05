from __future__ import annotations
from typing import List, Optional, Tuple, Dict, Any
from mahjong.hand_calculating.hand import HandCalculator
from mahjong.hand_calculating.hand_config import HandConfig, OptionalRules
from mahjong.meld import Meld
from mahjong.shanten import Shanten
from mahjong.tile import TilesConverter

from mahjong.constants import EAST, SOUTH, WEST, NORTH

WINDS = [EAST, SOUTH, WEST, NORTH]

YAKU_KR_MAP: Dict[str, str] = {
    "Menzen Tsumo": "멘젠쯔모 (Menzen Tsumo)",
    "Riichi": "리치 (Riichi)",
    "Open Riichi": "오픈 리치 (Open Riichi)",
    "Ippatsu": "일발 (Ippatsu)",
    "Chankan": "창깡 (Chankan)",
    "Rinshan Kaihou": "영상개화 (Rinshan)",
    "Haitei Raoyue": "해저로월 (Haitei)",
    "Houtei Raoyui": "하저로어 (Houtei)",
    "Double Riichi": "더블 리치 (Double Riichi)",
    "Double Open Riichi": "더블 오픈 리치",
    "Nagashi Mangan": "유국만관 (Nagashi Mangan)",
    "Renhou": "인화 (Renhou)",
    "Pinfu": "핑후 (Pinfu)",
    "Tanyao": "탕야오 (Tanyao)",
    "Iipeiko": "이페코 (Iipeiko)",
    "Yakuhai (haku)": "역패: 백 (Haku)",
    "Yakuhai (hatsu)": "역패: 발 (Hatsu)",
    "Yakuhai (chun)": "역패: 중 (Chun)",
    "Yakuhai (seat wind east)": "자풍패: 동 (Seat East)",
    "Yakuhai (seat wind south)": "자풍패: 남 (Seat South)",
    "Yakuhai (seat wind west)": "자풍패: 서 (Seat West)",
    "Yakuhai (seat wind north)": "자풍패: 북 (Seat North)",
    "Yakuhai (round wind east)": "장풍패: 동 (Round East)",
    "Yakuhai (round wind south)": "장풍패: 남 (Round South)",
    "Yakuhai (round wind west)": "장풍패: 서 (Round West)",
    "Yakuhai (round wind north)": "장풍패: 북 (Round North)",
    "Sanshoku Doujun": "삼색동순 (Sanshoku)",
    "Ittsu": "일기통관 (Ittsu)",
    "Chantai": "찬타 (Chantai)",
    "Honroutou": "혼노두 (Honroutou)",
    "Toitoi": "또이또이 (Toitoi)",
    "San Ankou": "산안커 (San Ankou)",
    "San Kantsu": "산깡쯔 (San Kantsu)",
    "Sanshoku Doukou": "삼색동각 (Sanshoku Doukou)",
    "Chiitoitsu": "치또이쯔 (Chiitoitsu)",
    "Shou Sangen": "소삼원 (Shou Sangen)",
    "Honitsu": "혼일색 (Honitsu)",
    "Junchan": "준찬타 (Junchan)",
    "Ryanpeikou": "량페코 (Ryanpeikou)",
    "Chinitsu": "청일색 (Chinitsu)",
    "Kokushi Musou": "국사무쌍 (Kokushi Musou)",
    "Chuuren Poutou": "구련보등 (Chuuren Poutou)",
    "Suu Ankou": "스안커 (Suu Ankou)",
    "Daisangen": "대삼원 (Daisangen)",
    "Shousuushii": "소사희 (Shousuushii)",
    "Ryuuiisou": "녹일색 (Ryuuiisou)",
    "Suu Kantsu": "스깡쯔 (Suu Kantsu)",
    "Tsuu Iisou": "자일색 (Tsuu Iisou)",
    "Chinroutou": "청노두 (Chinroutou)",
    "Daisharin": "대차륜 (Daisharin)",
    "Daichisei": "대칠성 (Daichisei)",
    "Dai Suushii": "대사희 (Dai Suushii)",
    "Kokushi Musou Juusanmen Matchi": "국사무쌍 13면대기",
    "Suu Ankou Tanki": "스안커 단기 (Suu Ankou Tanki)",
    "Daburu Chuuren Poutou": "순정구련보등",
    "Tenhou": "천화 (Tenhou)",
    "Chiihou": "지화 (Chiihou)",
    "Renhou (yakuman)": "인화 (역만)",
    "Dora": "도라 (Dora)",
    "Aka Dora": "적도라 (Aka Dora)",
    "Ura Dora": "뒷도라 (Ura Dora)",
}
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
    # In python-mahjong, 16 (5m), 52 (5p), 88 (5s) are reserved for Aka Dora (red fives)
    if tile in ("5mr", "0m"):
        used_indices.add(16)
        return 16
    elif tile in ("5pr", "0p"):
        used_indices.add(52)
        return 52
    elif tile in ("5sr", "0s"):
        used_indices.add(88)
        return 88

    # Normal 5m, 5p, 5s must use offsets 1, 2, 3 so they are not counted as Aka Dora
    start_offset = 1 if tile in ("5m", "5p", "5s") else 0
    for offset in range(start_offset, 4):
        candidate = base + offset
        if candidate not in used_indices:
            used_indices.add(candidate)
            return candidate
    return base + start_offset

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
        num_melds = len(melds) if melds else 0
        expected_closed_without_win = 13 - 3 * num_melds

        closed_tiles = list(hand_tiles)
        if len(closed_tiles) > expected_closed_without_win:
            # hand_tiles already includes the drawn winning tile (Tsumo); remove one instance of win_tile
            removed = False
            for idx in range(len(closed_tiles) - 1, -1, -1):
                if closed_tiles[idx] == win_tile:
                    closed_tiles.pop(idx)
                    removed = True
                    break
            if not removed and closed_tiles:
                closed_tiles.pop()

        closed_136 = [tile_to_136(t, used_indices) for t in closed_tiles]
        win_tile_136 = tile_to_136(win_tile, used_indices)

        converted_melds = []
        meld_tiles_136: List[int] = []
        if melds:
            for m in melds:
                m_type = m["type"]
                m_tiles = [tile_to_136(t, used_indices) for t in m["tiles"]]
                m_tiles_sorted = sorted(m_tiles)
                meld_tiles_136.extend(m_tiles_sorted)
                if m_type == "chi":
                    converted_melds.append(Meld(Meld.CHI, m_tiles_sorted, opened=True))
                elif m_type == "pon":
                    converted_melds.append(Meld(Meld.PON, m_tiles_sorted, opened=True))
                elif m_type == "daiminkan":
                    converted_melds.append(Meld(Meld.KAN, m_tiles_sorted, opened=True))
                elif m_type == "ankan":
                    converted_melds.append(Meld(Meld.KAN, m_tiles_sorted, opened=False))
                elif m_type == "kakan":
                    converted_melds.append(Meld(Meld.CHANKAN, m_tiles_sorted, opened=True))

        tiles_136 = closed_136 + [win_tile_136] + meld_tiles_136

        dora_used: set[int] = set()
        dora_136 = [tile_to_136(d, dora_used) for d in dora_indicators]
        ura_used: set[int] = set()
        ura_136 = [tile_to_136(u, ura_used) for u in (ura_dora_indicators or [])]

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
            ura_dora_indicators=ura_136,
            config=config,
        )

        is_open_hand = any(m.opened for m in converted_melds)
        yaku_list = []
        if result.yaku:
            for y in result.yaku:
                han_val = y.han_open if is_open_hand and y.han_open else y.han_closed
                yaku_list.append({
                    "name": YAKU_KR_MAP.get(y.name, y.name),
                    "name_en": y.name,
                    "han": han_val,
                    "is_yakuman": y.is_yakuman,
                })

        cost = result.cost or {"main": 0, "additional": 0, "total": 0}
        han = result.han or 0
        fu = result.fu or 0
        raw_level = (cost.get("yaku_level") or "").lower()
        is_any_yakuman = any(y.get("is_yakuman", False) for y in yaku_list)

        if is_any_yakuman or "yakuman" in raw_level or han >= 13:
            yaku_level_name = "역만 (役満)"
        elif "sanbaiman" in raw_level or han >= 11:
            yaku_level_name = "삼배만 (三倍満)"
        elif "baiman" in raw_level or han >= 8:
            yaku_level_name = "배만 (倍満)"
        elif "haneman" in raw_level or han >= 6:
            yaku_level_name = "하네만 (跳満)"
        elif "mangan" in raw_level or han >= 5 or (han == 4 and fu >= 40) or (han == 3 and fu >= 70):
            yaku_level_name = "만관 (満貫)"
        else:
            yaku_level_name = ""

        return {
            "error": result.error,
            "han": han,
            "fu": fu,
            "cost": cost,
            "yaku_level_name": yaku_level_name,
            "yaku": yaku_list,
            "is_dealer": is_dealer,
            "is_tsumo": is_tsumo,
        }
