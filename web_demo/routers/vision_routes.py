# vision_routes.py - 视觉识别路由
from __future__ import annotations

import base64
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel

from ..services.auth_service import verify_password
from ..services.vision_service import identify_chemical_from_image, check_storage_compatibility
from ..services.kb_service import retrieve_citations
from ..services.answer_service import build_fast_path_answer

router = APIRouter(dependencies=[Depends(verify_password)])
logger = logging.getLogger(__name__)


class ChemicalIdentifyResponse(BaseModel):
    chemical_name: str
    confidence: float
    hazard_types: list[str] = []
    storage_requirements: str = ""
    incompatible_with: list[str] = []
    safety_answer: str = ""
    citations: list[Any] = []


class StorageCheckRequest(BaseModel):
    chemicals: list[str]


class StorageCheckResponse(BaseModel):
    compatible: bool
    conflict_count: int
    conflicts: list[dict[str, Any]]
    recommendation: str


@router.post("/api/vision/identify", response_model=ChemicalIdentifyResponse)
async def identify_chemical(file: UploadFile = File(...)) -> ChemicalIdentifyResponse:
    """
    上传化学品标签图片，识别化学品并返回安全信息

    创新点：
    1. 图片 → 化学品名称（OCR + LLM）
    2. 自动查询知识库安全信息
    3. 生成安全操作建议
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="只支持图片文件")

    # 读取图片
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB 限制
        raise HTTPException(status_code=400, detail="图片过大，请小于10MB")

    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    # 识别化学品
    result = identify_chemical_from_image(image_base64)
    chemical_name = result.get("chemical_name", "")

    if not chemical_name or chemical_name == "示例化学品":
        return ChemicalIdentifyResponse(
            chemical_name="未能识别",
            confidence=0.0,
            safety_answer="图片不清晰或未包含化学品标签，请重新拍摄"
        )

    # 从知识库查询安全信息
    query = f"{chemical_name} 安全操作 存储 应急处理"
    citations = retrieve_citations(query, top_k=5)

    # 生成安全建议
    safety_answer = ""
    if citations:
        safety_answer = build_fast_path_answer(
            f"识别到化学品：{chemical_name}，请告诉我安全操作要点",
            citations
        )
    else:
        safety_answer = f"未在知识库中找到 {chemical_name} 的详细信息，请查阅MSDS或咨询专业人员。"

    return ChemicalIdentifyResponse(
        chemical_name=chemical_name,
        confidence=result.get("confidence", 0.0),
        hazard_types=result.get("hazard_class", []),
        storage_requirements=result.get("storage_requirements", ""),
        incompatible_with=result.get("incompatible_with", []),
        safety_answer=safety_answer,
        citations=[c.model_dump() for c in citations]
    )


@router.post("/api/vision/check-storage", response_model=StorageCheckResponse)
def check_storage(payload: StorageCheckRequest) -> StorageCheckResponse:
    """
    检查多个化学品是否可以同柜存放

    创新点：
    1. 自动识别配伍禁忌
    2. 生成分区存储方案
    3. 可视化风险提示
    """
    if not payload.chemicals or len(payload.chemicals) < 2:
        raise HTTPException(status_code=400, detail="至少需要输入2个化学品名称")

    result = check_storage_compatibility(payload.chemicals)

    # 生成建议
    if result["compatible"]:
        recommendation = "✅ 这些化学品可以同柜存放，但仍需遵守分类存储原则。"
    else:
        recommendation = f"⚠️ 发现 {len(result['conflicts'])} 组配伍禁忌，必须分开存放！\n\n"
        for conflict in result["conflicts"]:
            pair = conflict["pair"]
            risk = conflict["risk"]
            recommendation += f"• {pair[0]} 与 {pair[1]}：{risk}\n"

    return StorageCheckResponse(
        compatible=result["compatible"],
        conflict_count=result["conflict_count"],
        conflicts=result["conflicts"],
        recommendation=recommendation
    )
