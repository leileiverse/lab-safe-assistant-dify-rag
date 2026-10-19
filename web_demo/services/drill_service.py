from __future__ import annotations

"""安全闯关游戏服务 — 场景加载、答题判定、知识关联。

场景以 JSON 文件存放在 web_demo/data/drill_scenarios/ 下，
每个场景是一个独立关卡，包含场景描述、选项、后果反馈和关联的 KB 条目。

所有安全知识点均关联到 knowledge_base_curated.csv 中的真实条目，
绝不凭空编造安全相关内容。
"""

import json
import logging
import threading
import time
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 路径与缓存
# ---------------------------------------------------------------------------

_SCENARIO_DIR = Path(__file__).resolve().parent.parent / "data" / "drill_scenarios"
_LOAD_LOCK = threading.Lock()
_scenarios_cache: list[dict] = []
_scenarios_mtime: float = 0.0
_CACHE_TTL = 30  # 秒


def _dir_latest_mtime(d: Path) -> float:
    """获取目录中所有 JSON 文件的最新 mtime。"""
    if not d.exists():
        return 0.0
    latest = 0.0
    for f in d.glob("*.json"):
        m = f.stat().st_mtime
        if m > latest:
            latest = m
    return latest


def _load_all_scenarios() -> list[dict]:
    """加载全部场景文件，带 mtime 缓存。"""
    global _scenarios_mtime, _scenarios_cache

    latest = _dir_latest_mtime(_SCENARIO_DIR)
    if _scenarios_cache and abs(latest - _scenarios_mtime) < 0.001:
        return _scenarios_cache

    with _LOAD_LOCK:
        # double check
        latest2 = _dir_latest_mtime(_SCENARIO_DIR)
        if _scenarios_cache and abs(latest2 - _scenarios_mtime) < 0.001:
            return _scenarios_cache

        scenarios: list[dict] = []
        if _SCENARIO_DIR.exists():
            for f in sorted(_SCENARIO_DIR.glob("*.json")):
                try:
                    with f.open("r", encoding="utf-8-sig") as fh:
                        data = json.load(fh)
                    if not isinstance(data, dict):
                        logger.warning("drill scenario %s is not a dict, skip", f.name)
                        continue
                    sid = str(data.get("scenario_id") or f.stem)
                    data["scenario_id"] = sid
                    scenarios.append(data)
                    logger.info("loaded drill scenario: %s (%s)", sid, data.get("title", ""))
                except Exception as exc:
                    logger.error("failed to load drill scenario %s: %s", f.name, exc)

        # 按分类 + 难度排序
        cat_order = {
            "chemical": 0,
            "equipment": 1,
            "emergency": 2,
            "ppe": 3,
            "waste": 4,
        }
        diff_order = {"beginner": 0, "intermediate": 1, "advanced": 2}
        scenarios.sort(
            key=lambda s: (
                cat_order.get(s.get("category", "other"), 99),
                diff_order.get(s.get("difficulty", "beginner"), 9),
                s.get("title", ""),
            )
        )

        _scenarios_cache = scenarios
        _scenarios_mtime = latest2
        return scenarios


def get_scenario(scenario_id: str) -> dict | None:
    """根据 ID 获取单个场景定义。"""
    scenarios = _load_all_scenarios()
    for s in scenarios:
        if s.get("scenario_id") == scenario_id:
            return s
    return None


# ---------------------------------------------------------------------------
# 公共 API
# ---------------------------------------------------------------------------

def list_scenarios() -> dict[str, Any]:
    """返回场景列表（按分类分组）。"""
    scenarios = _load_all_scenarios()

    categories: dict[str, dict[str, Any]] = {
        "chemical": {"key": "chemical", "name": "危化品操作", "icon": "flask", "scenarios": []},
        "equipment": {"key": "equipment", "name": "设备安全", "icon": "instrument", "scenarios": []},
        "emergency": {"key": "emergency", "name": "应急处置", "icon": "alert", "scenarios": []},
        "ppe": {"key": "ppe", "name": "个人防护", "icon": "goggles", "scenarios": []},
        "waste": {"key": "waste", "name": "废弃物管理", "icon": "waste", "scenarios": []},
    }

    for s in scenarios:
        cat = s.get("category", "other")
        entry = {
            "scenario_id": s.get("scenario_id", ""),
            "title": s.get("title", ""),
            "category": cat,
            "difficulty": s.get("difficulty", "beginner"),
            "background": s.get("background", "A"),
            "overlay_svgs": s.get("overlay_svgs", []),
            "option_count": len(s.get("options", [])),
        }
        if cat in categories:
            categories[cat]["scenarios"].append(entry)
        else:
            # 未知分类放到"其他"
            if "other" not in categories:
                categories["other"] = {"key": "other", "name": "其他", "icon": "help", "scenarios": []}
            categories["other"]["scenarios"].append(entry)

    # 移除空分类
    category_list = [c for c in categories.values() if c["scenarios"]]

    return {
        "total": len(scenarios),
        "category_count": len(category_list),
        "categories": category_list,
    }


def get_scenario_detail(scenario_id: str) -> dict[str, Any] | None:
    """获取场景完整定义（不含正确答案标识，防止前端作弊）。"""
    s = get_scenario(scenario_id)
    if not s:
        return None

    # 脱敏：移除 feedback_type 和 score_delta
    safe_options = []
    for opt in s.get("options", []):
        safe_opt = {
            "id": opt.get("id", ""),
            "text": opt.get("text", ""),
        }
        safe_options.append(safe_opt)

    return {
        "scenario_id": s.get("scenario_id", ""),
        "title": s.get("title", ""),
        "category": s.get("category", ""),
        "difficulty": s.get("difficulty", ""),
        "background": s.get("background", "A"),
        "overlay_svgs": s.get("overlay_svgs", []),
        "narrative": s.get("narrative", ""),
        "hint": s.get("hint", ""),
        "options": safe_options,
    }


def submit_answer(scenario_id: str, option_id: str) -> dict[str, Any]:
    """提交答案，返回后果反馈 + 关联 KB 条目详情。

    返回字段：
      - option_id, option_text
      - result_text
      - feedback_type: correct / warning / danger
      - score_delta
      - is_deadly
      - kb_references: 关联的知识库条目详情
      - next_background, next_svgs
    """
    s = get_scenario(scenario_id)
    if not s:
        raise ValueError(f"scenario not found: {scenario_id}")

    chosen = None
    for opt in s.get("options", []):
        if opt.get("id") == option_id:
            chosen = opt
            break
    if not chosen:
        raise ValueError(f"invalid option_id: {option_id}")

    feedback_type = str(chosen.get("feedback_type", "warning"))
    score_delta = int(chosen.get("score_delta", 0))
    is_deadly = bool(chosen.get("is_deadly", False))
    result_text = str(chosen.get("result", ""))
    next_bg = chosen.get("next_background") or s.get("background", "A")
    next_svgs = chosen.get("next_svgs", [])
    kb_ids = [str(x) for x in (chosen.get("kb_ids") or []) if x]

    # 从 KB 加载引用详情
    kb_refs = _load_kb_references(kb_ids)

    return {
        "scenario_id": scenario_id,
        "option_id": option_id,
        "option_text": chosen.get("text", ""),
        "result_text": result_text,
        "feedback_type": feedback_type,
        "score_delta": score_delta,
        "is_deadly": is_deadly,
        "kb_references": kb_refs,
        "next_background": next_bg,
        "next_svgs": next_svgs,
    }


# ---------------------------------------------------------------------------
# KB 引用加载
# ---------------------------------------------------------------------------

def _load_kb_references(kb_ids: list[str]) -> list[dict[str, str]]:
    """根据 KB ID 列表从知识库中加载详细条目。"""
    if not kb_ids:
        return []
    try:
        from ..repositories import get_kb_entries
        kb = get_kb_entries()
        id_set = set(kb_ids)
        results = []
        for row in kb:
            rid = str(row.get("id", "")).strip()
            if rid in id_set:
                snippet = " ".join(
                    p for p in [
                        str(row.get("answer", "")),
                        str(row.get("steps", "")),
                        str(row.get("forbidden", "")),
                    ] if p
                )[:260]
                results.append({
                    "kb_id": rid,
                    "title": str(row.get("title", "")),
                    "category": str(row.get("category", "")),
                    "subcategory": str(row.get("subcategory", "")),
                    "risk_level": str(row.get("risk_level", "")),
                    "source_title": str(row.get("source_title", "")),
                    "source_org": str(row.get("source_org", "")),
                    "source_url": str(row.get("source_url", "")),
                    "snippet": snippet,
                    "steps": str(row.get("steps", "")),
                    "forbidden": str(row.get("forbidden", "")),
                    "first_aid": str(row.get("first_aid", "")),
                    "emergency": str(row.get("emergency", "")),
                })
        # 保持请求顺序
        results.sort(key=lambda r: kb_ids.index(r["kb_id"]) if r["kb_id"] in kb_ids else 999)
        return results
    except Exception as exc:
        logger.warning("_load_kb_references failed: %s", exc)
        return []
