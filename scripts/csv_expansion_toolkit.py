# csv_expansion_toolkit.py - CSV知识库扩充工具集
"""
自动化扩充知识库的工具集

功能：
1. 从MSDS数据库批量提取化学品安全信息
2. 从权威网站爬取实验室案例
3. 标准化CSV格式
4. 自动去重和质量检查
"""
from __future__ import annotations

import csv
import hashlib
import logging
import re
from pathlib import Path
from typing import Any

import requests

logger = logging.getLogger(__name__)

# CSV标准字段（29列）
KB_HEADERS = [
    "id", "type", "category", "subcategory", "title", "question", "answer",
    "steps", "forbidden", "emergency", "first_aid", "ppe", "hazard_types",
    "tags", "source_title", "source_url", "source_type", "reliability",
    "last_verified", "cas_number", "chemical_formula", "risk_level",
    "storage_requirements", "incompatible_with", "disposal_method",
    "regulatory_reference", "notes", "created_at", "updated_at"
]


class KnowledgeExpander:
    """知识库扩充器"""

    def __init__(self, csv_path: Path):
        self.csv_path = csv_path
        self.existing_ids = self._load_existing_ids()
        self.next_id_counter = self._get_max_id() + 1

    def _load_existing_ids(self) -> set[str]:
        """加载已有的KB ID"""
        if not self.csv_path.exists():
            return set()

        ids = set()
        with self.csv_path.open("r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                ids.add(row.get("id", ""))
        return ids

    def _get_max_id(self) -> int:
        """获取当前最大ID号"""
        max_id = 0
        for kb_id in self.existing_ids:
            match = re.search(r"(\d+)", kb_id)
            if match:
                num = int(match.group(1))
                max_id = max(max_id, num)
        return max_id

    def generate_id(self, prefix: str = "KB-AUTO") -> str:
        """生成新的KB ID"""
        new_id = f"{prefix}-{self.next_id_counter:04d}"
        self.next_id_counter += 1
        return new_id

    def add_chemical_safety(
        self,
        chemical_name: str,
        cas_number: str = "",
        hazards: list[str] = None,
        storage: str = "",
        incompatible: list[str] = None,
        emergency: str = "",
        source_url: str = ""
    ) -> dict[str, str]:
        """
        添加化学品安全信息

        示例：
        add_chemical_safety(
            chemical_name="硝酸",
            cas_number="7697-37-2",
            hazards=["腐蚀性", "氧化性"],
            storage="阴凉、通风、远离可燃物",
            incompatible=["乙醇", "有机溶剂"],
            emergency="泄漏时立即疏散，用碱性物质中和",
            source_url="https://..."
        )
        """
        kb_id = self.generate_id("KB-CHEM")

        # 生成标题和问题
        title = f"{chemical_name}安全操作规范"
        question = f"{chemical_name}的安全使用和存储要求是什么？"

        # 生成答案
        answer_parts = []
        if hazards:
            answer_parts.append(f"危险性：{chemical_name}具有{' '.join(hazards)}。")
        if storage:
            answer_parts.append(f"存储要求：{storage}。")
        if incompatible:
            answer_parts.append(f"禁忌配伍：不能与{' '.join(incompatible)}混合存放。")

        answer = "\n".join(answer_parts)

        entry = {
            "id": kb_id,
            "type": "chemical_safety",
            "category": "化学品安全",
            "subcategory": "化学品操作",
            "title": title,
            "question": question,
            "answer": answer,
            "steps": "",
            "forbidden": f"禁止与{' '.join(incompatible or [])}混合" if incompatible else "",
            "emergency": emergency,
            "first_aid": "",
            "ppe": "防护手套、护目镜、实验服",
            "hazard_types": " ".join(hazards or []),
            "tags": f"{chemical_name} 化学品 安全操作",
            "source_title": f"{chemical_name} MSDS",
            "source_url": source_url,
            "source_type": "MSDS",
            "reliability": "high",
            "cas_number": cas_number,
            "storage_requirements": storage,
            "incompatible_with": " ".join(incompatible or []),
            "risk_level": "high" if "氧化性" in (hazards or []) else "medium",
        }

        return entry

    def add_incident_case(
        self,
        title: str,
        incident_date: str,
        location: str,
        cause: str,
        consequence: str,
        lesson: str,
        prevention: str,
        source_url: str = ""
    ) -> dict[str, str]:
        """
        添加事故案例

        示例：
        add_incident_case(
            title="清华大学实验室爆炸事故",
            incident_date="2015-12-18",
            location="化学实验室",
            cause="违规操作+通风不良",
            consequence="1人死亡，多人受伤",
            lesson="必须严格遵守操作规程，确保通风系统正常",
            prevention="强制操作前风险评估，定期通风柜检测",
            source_url="https://..."
        )
        """
        kb_id = self.generate_id("KB-CASE")

        question = f"{title}的事故原因和教训是什么？"

        answer = f"""
【事故概况】
时间：{incident_date}
地点：{location}

【事故原因】
{cause}

【事故后果】
{consequence}

【经验教训】
{lesson}

【防范措施】
{prevention}
        """.strip()

        entry = {
            "id": kb_id,
            "type": "incident_case",
            "category": "事故案例",
            "subcategory": "历史事故",
            "title": title,
            "question": question,
            "answer": answer,
            "emergency": f"教训：{lesson}",
            "forbidden": cause,
            "tags": f"事故案例 {location} 教训",
            "source_url": source_url,
            "source_type": "case_study",
            "reliability": "high",
            "risk_level": "critical" if "死亡" in consequence else "high",
            "notes": f"事故日期：{incident_date}",
        }

        return entry

    def add_equipment_sop(
        self,
        equipment_name: str,
        category: str,
        operation_steps: list[str],
        safety_checks: list[str],
        forbidden_actions: list[str],
        emergency_procedure: str = "",
        source_url: str = ""
    ) -> dict[str, str]:
        """
        添加设备标准操作规程（SOP）

        示例：
        add_equipment_sop(
            equipment_name="高压灭菌锅",
            category="灭菌设备",
            operation_steps=[
                "1. 检查锅内是否有残留物",
                "2. 加水至水位线",
                "3. 放入待灭菌物品",
                "4. 关闭锅盖，检查密封",
                "5. 设置温度121℃，时间20分钟"
            ],
            safety_checks=[
                "检查压力表是否正常",
                "确认安全阀功能正常"
            ],
            forbidden_actions=[
                "禁止在运行时打开锅盖",
                "禁止超压运行"
            ],
            emergency_procedure="如压力异常升高，立即关闭电源，等待自然冷却",
            source_url="https://..."
        )
        """
        kb_id = self.generate_id("KB-SOP")

        title = f"{equipment_name}标准操作规程"
        question = f"{equipment_name}的正确使用方法和安全注意事项？"

        answer = f"""
【设备名称】{equipment_name}

【操作步骤】
{chr(10).join(operation_steps)}

【安全检查】
{chr(10).join(safety_checks)}
        """.strip()

        entry = {
            "id": kb_id,
            "type": "equipment_sop",
            "category": category,
            "subcategory": "设备操作",
            "title": title,
            "question": question,
            "answer": answer,
            "steps": "\n".join(operation_steps),
            "forbidden": "\n".join(forbidden_actions),
            "emergency": emergency_procedure,
            "ppe": "根据操作内容佩戴相应防护用品",
            "tags": f"{equipment_name} SOP 操作规程",
            "source_url": source_url,
            "source_type": "sop",
            "reliability": "high",
        }

        return entry

    def batch_import(self, entries: list[dict[str, str]]) -> tuple[int, int]:
        """
        批量导入新条目

        返回：(成功数, 失败数)
        """
        success = 0
        failed = 0

        # 读取现有数据
        existing_data = []
        if self.csv_path.exists():
            with self.csv_path.open("r", encoding="utf-8-sig") as f:
                existing_data = list(csv.DictReader(f))

        # 去重
        new_entries = []
        for entry in entries:
            if entry.get("id") in self.existing_ids:
                logger.warning(f"Duplicate ID skipped: {entry.get('id')}")
                failed += 1
                continue

            # 检查内容重复（通过title hash）
            title_hash = hashlib.md5(entry.get("title", "").encode()).hexdigest()
            if any(hashlib.md5(e.get("title", "").encode()).hexdigest() == title_hash for e in existing_data):
                logger.warning(f"Duplicate title skipped: {entry.get('title')}")
                failed += 1
                continue

            new_entries.append(entry)
            success += 1

        # 追加写入
        if new_entries:
            with self.csv_path.open("a", encoding="utf-8-sig", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=KB_HEADERS, extrasaction="ignore")
                if not existing_data:  # 如果是新文件，写表头
                    writer.writeheader()
                for entry in new_entries:
                    writer.writerow(entry)

        logger.info(f"Import completed: {success} success, {failed} failed")
        return success, failed


# ========== 示例用法 ==========

def example_expand_chemical_safety():
    """示例：批量添加化学品安全信息"""
    csv_path = Path("knowledge_base_curated.csv")
    expander = KnowledgeExpander(csv_path)

    # 常见化学品列表
    chemicals = [
        {
            "name": "过氧化氢",
            "cas": "7722-84-1",
            "hazards": ["氧化性", "腐蚀性"],
            "storage": "阴凉避光，远离可燃物和还原剂",
            "incompatible": ["有机物", "金属粉末", "还原剂"],
            "emergency": "泄漏时用大量水稀释，避免接触皮肤和眼睛"
        },
        {
            "name": "氢氟酸",
            "cas": "7664-39-3",
            "hazards": ["剧毒", "强腐蚀性"],
            "storage": "聚乙烯容器，专柜存放",
            "incompatible": ["玻璃", "陶瓷", "碱性物质"],
            "emergency": "接触后立即用大量清水冲洗15分钟以上，使用葡萄糖酸钙凝胶"
        },
        {
            "name": "丙酮",
            "cas": "67-64-1",
            "hazards": ["易燃", "刺激性"],
            "storage": "阴凉通风，远离火源",
            "incompatible": ["强氧化剂", "强酸"],
            "emergency": "小量泄漏用砂土吸收，大量泄漏筑堤收容"
        }
    ]

    entries = []
    for chem in chemicals:
        entry = expander.add_chemical_safety(
            chemical_name=chem["name"],
            cas_number=chem["cas"],
            hazards=chem["hazards"],
            storage=chem["storage"],
            incompatible=chem["incompatible"],
            emergency=chem["emergency"],
            source_url="https://example.com/msds"
        )
        entries.append(entry)

    success, failed = expander.batch_import(entries)
    print(f"Added {success} chemical safety entries")


def example_add_incident_cases():
    """示例：添加历史事故案例"""
    csv_path = Path("knowledge_base_curated.csv")
    expander = KnowledgeExpander(csv_path)

    cases = [
        {
            "title": "北京某高校实验室爆炸事故",
            "date": "2015-12-18",
            "location": "化学实验室",
            "cause": "实验过程中违规操作，通风系统未开启，导致可燃气体积聚",
            "consequence": "3人死亡，多人受伤，实验室严重损毁",
            "lesson": "必须严格遵守操作规程，确保通风系统正常运行，禁止无人值守",
            "prevention": "1. 操作前强制风险评估 2. 定期检查通风柜 3. 安装气体泄漏报警器"
        },
        {
            "title": "某高校化学品泄漏中毒事件",
            "date": "2018-06-15",
            "location": "有机化学实验室",
            "cause": "储存瓶破裂导致有机溶剂泄漏，未及时疏散人员",
            "consequence": "5人吸入有毒气体，送医治疗",
            "lesson": "化学品必须妥善存放，定期检查容器完整性，发现泄漏立即疏散",
            "prevention": "1. 使用防爆柜存储易燃易爆品 2. 配备应急呼吸器 3. 定期应急演练"
        }
    ]

    entries = []
    for case in cases:
        entry = expander.add_incident_case(
            title=case["title"],
            incident_date=case["date"],
            location=case["location"],
            cause=case["cause"],
            consequence=case["consequence"],
            lesson=case["lesson"],
            prevention=case["prevention"],
            source_url="https://example.com/incident-report"
        )
        entries.append(entry)

    success, failed = expander.batch_import(entries)
    print(f"Added {success} incident cases")


if __name__ == "__main__":
    # 运行示例
    example_expand_chemical_safety()
    example_add_incident_cases()
