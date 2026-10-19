from __future__ import annotations

"""安全闯关游戏 API 路由。

GET    /api/drill/scenarios         场景列表（按分类分组）
GET    /api/drill/scenarios/{id}    场景详情（脱敏，不含答案）
POST   /api/drill/submit            提交答案，返回后果 + KB 引用
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..services.auth_service import verify_password
from ..services import drill_service

router = APIRouter(dependencies=[Depends(verify_password)])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 请求模型
# ---------------------------------------------------------------------------

class DrillSubmitRequest(BaseModel):
    scenario_id: str = Field(..., min_length=1, max_length=64)
    option_id: str = Field(..., min_length=1, max_length=16)


# ---------------------------------------------------------------------------
# 路由
# ---------------------------------------------------------------------------

@router.get("/api/drill/scenarios")
def drill_scenarios() -> dict:
    """获取所有闯关场景，按分类分组。"""
    try:
        return drill_service.list_scenarios()
    except Exception as exc:
        logger.exception("list_scenarios failed")
        raise HTTPException(status_code=500, detail=f"加载场景列表失败: {exc}")


@router.get("/api/drill/scenarios/{scenario_id}")
def drill_scenario_detail(scenario_id: str) -> dict:
    """获取单个场景详情（不含正确答案标记，防止前端作弊）。"""
    data = drill_service.get_scenario_detail(scenario_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"场景不存在: {scenario_id}")
    return data


@router.post("/api/drill/submit")
def drill_submit(payload: DrillSubmitRequest) -> dict:
    """提交答案，返回后果反馈 + 关联知识库条目。"""
    try:
        return drill_service.submit_answer(payload.scenario_id, payload.option_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("submit_answer failed")
        raise HTTPException(status_code=500, detail=f"提交失败: {exc}")
