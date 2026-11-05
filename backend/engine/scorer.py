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
    "Menzen Tsumo": "멘젠쯔모 (門前清自摸和)",
    "Riichi": "리치 (立直)",
    "Open Riichi": "오픈 리치 (開立直)",
    "Ippatsu": "일발 (一発)",
    "Chankan": "창깡 (槍槓)",
    "Rinshan Kaihou": "영상개화 (嶺上開花)",
    "Haitei Raoyue": "해저로월 (海底摸月)",
    "Houtei Raoyui": "하저로어 (河底撈魚)",
    "Double Riichi": "더블 리치 (ダブル立直)",
    "Double Open Riichi": "더블 오픈 리치",
    "Nagashi Mangan": "유국만관 (流し満貫)",
    "Renhou": "인화 (人和)",
    "Pinfu": "핑후 (平和)",
    "Tanyao": "탕야오 (断么九)",
    "Iipeiko": "이페코 (一盃口)",
    "Yakuhai (haku)": "역패: 백 (役牌 白)",
    "Yakuhai (hatsu)": "역패: 발 (役牌 發)",
    "Yakuhai (chun)": "역패: 중 (役牌 中)",
    "Yakuhai (seat wind east)": "자풍: 동 (自風 東)",
    "Yakuhai (seat wind south)": "자풍: 남 (自風 南)",
    "Yakuhai (seat wind west)": "자풍: 서 (自風 西)",
    "Yakuhai (seat wind north)": "자풍: 북 (自風 北)",
    "Yakuhai (round wind east)": "장풍: 동 (場風 東)",
    "Yakuhai (round wind south)": "장풍: 남 (場風 南)",
    "Yakuhai (round wind west)": "장풍: 서 (場風 西)",
    "Yakuhai (round wind north)": "장풍: 북 (場風 北)",
    "Sanshoku Doujun": "삼색동순 (三色同順)",
    "Ittsu": "일기통관 (一気通貫)",
    "Chantai": "찬타 (混全帯么九)",
    "Honroutou": "혼노두 (混老頭)",
    "Toitoi": "또이또이 (対々和)",
    "San Ankou": "산안커 (三暗刻)",
    "San Kantsu": "산깡쯔 (三槓子)",
    "Sanshoku Doukou": "삼색동각 (三色同刻)",
    "Chiitoitsu": "치또이쯔 (七対子)",
    "Shou Sangen": "소삼원 (小三元)",
    "Honitsu": "혼일색 (混一色)",
    "Junchan": "준찬타 (純全帯么九)",
    "Ryanpeikou": "량페코 (二盃口)",
    "Chinitsu": "청일색 (清一色)",
    "Kokushi Musou": "국사무쌍 (国士無双)",
    "Chuuren Poutou": "구련보등 (九蓮宝燈)",
    "Suu Ankou": "스안커 (四暗刻)",
    "Daisangen": "대삼원 (大三元)",
    "Shousuushii": "소사희 (小四喜)",
    "Ryuuiisou": "녹일색 (緑一色)",
    "Suu Kantsu": "스깡쯔 (四槓子)",
    "Tsuu Iisou": "자일색 (字一色)",
    "Chinroutou": "청노두 (清老頭)",
    "Daisharin": "대차륜 (大車輪)",
    "Daichisei": "대칠성 (大七星)",
    "Dai Suushii": "대사희 (大四喜)",
    "Kokushi Musou Juusanmen Matchi": "국사무쌍 13면대기 (国士無双十三面待ち)",
    "Suu Ankou Tanki": "스안커 단기 (四暗刻単騎)",
    "Daburu Chuuren Poutou": "순정구련보등 (純正九蓮宝燈)",
    "Tenhou": "천화 (天和)",
    "Chiihou": "지화 (地和)",
    "Renhou (yakuman)": "인화 (人和 - 役満)",
    "Dora": "도라 (ドラ)",
    "Aka Dora": "적도라 (赤ドラ)",
    "Ura Dora": "뒷도라 (裏ドラ)",
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
