# vision_service.py - 视觉识别服务
from __future__ import annotations

import base64
import logging
import re
from typing import Any

import requests

logger = logging.getLogger(__name__)


def identify_chemical_from_image(image_base64: str) -> dict[str, Any]:
    """
    识别化学品标签图片，返回化学品信息和安全建议

    输入：base64 编码的图片
    输出：{
        "chemical_name": "硝酸",
        "cas_number": "7697-37-2",
        "hazard_class": ["腐蚀性", "氧化性"],
        "storage_requirements": "阴凉、通风、远离可燃物",
        "incompatible_with": ["乙醇", "乙醚", "有机溶剂"],
        "emergency_contact": "泄漏立即疏散，联系专业处置"
    }
    """
    # TODO: 集成 Claude Vision API 或 OpenAI GPT-4V
    # 这里先返回 mock 数据示例

    # 实际实现：调用 Claude Vision
    # response = anthropic_client.messages.create(
    #     model="claude-3-5-sonnet-20241022",
    #     messages=[{
    #         "role": "user",
    #         "content": [
    #             {
    #                 "type": "image",
    #                 "source": {
    #                     "type": "base64",
    #                     "media_type": "image/jpeg",
    #                     "data": image_base64,
    #                 }
    #             },
    #             {
    #                 "type": "text",
    #                 "text": "识别图片中的化学品名称、CAS号、危险性分类。以JSON格式返回。"
    #             }
    #         ]
    #     }]
    # )

    return {
        "chemical_name": "示例化学品",
        "confidence": 0.95,
        "hazard_info": "待实现视觉识别"
    }


def check_storage_compatibility(chemicals: list[str]) -> dict[str, Any]:
    """
    检查多个化学品是否可以同柜存放

    输入：["硝酸", "乙醇", "丙酮"]
    输出：{
        "compatible": False,
        "conflicts": [
            {
                "pair": ["硝酸", "乙醇"],
                "risk": "硝酸是强氧化剂，乙醇易燃，可能引发火灾",
                "recommendation": "必须分开存放，至少间隔两个柜体"
            }
        ],
        "storage_groups": {
            "氧化剂区": ["硝酸"],
            "易燃溶剂区": ["乙醇", "丙酮"]
        }
    }
    """
    # 配伍禁忌规则库
    incompatible_pairs = [
        (["硝酸", "浓硫酸", "高锰酸钾"], ["乙醇", "乙醚", "丙酮", "甲醇"], "氧化剂与易燃溶剂"),
        (["氨水"], ["盐酸", "硫酸", "醋酸"], "碱与酸"),
        (["氯化物"], ["硝酸银"], "会生成沉淀"),
    ]

    conflicts = []
    for oxidizers, fuels, reason in incompatible_pairs:
        found_oxidizers = [c for c in chemicals if any(ox in c for ox in oxidizers)]
        found_fuels = [c for c in chemicals if any(f in c for f in fuels)]

        if found_oxidizers and found_fuels:
            for ox in found_oxidizers:
                for fuel in found_fuels:
                    conflicts.append({
                        "pair": [ox, fuel],
                        "risk": f"{reason}：可能引发火灾或爆炸",
                        "severity": "high",
                        "recommendation": "必须分开存放"
                    })

    return {
        "compatible": len(conflicts) == 0,
        "conflict_count": len(conflicts),
        "conflicts": conflicts
    }
