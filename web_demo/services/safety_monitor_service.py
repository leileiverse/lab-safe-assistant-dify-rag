# safety_monitor_service.py - 实时安全监控服务
from __future__ import annotations

import json
import logging
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# 监控数据存储
_MONITOR_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts" / "safety_monitor"
_MONITOR_DIR.mkdir(parents=True, exist_ok=True)

_ANOMALY_LOG = _MONITOR_DIR / "anomalies.jsonl"
_STATS_FILE = _MONITOR_DIR / "daily_stats.json"

_LOCK = threading.Lock()


class SafetyMonitor:
    """实时安全监控系统"""

    def __init__(self):
        self.high_risk_questions: list[dict] = []  # 24小时内的高风险问题
        self.anomaly_patterns: list[dict] = []  # 异常模式

    def record_question(self, question: str, risk_level: str, matched_rule_id: str, session_id: str):
        """记录问题，检测异常模式"""
        timestamp = time.time()

        # 高风险问题记录
        if risk_level in ["high", "critical"]:
            with _LOCK:
                self.high_risk_questions.append({
                    "timestamp": timestamp,
                    "question": question,
                    "risk_level": risk_level,
                    "rule_id": matched_rule_id,
                    "session_id": session_id
                })
                # 只保留24小时内的
                cutoff = timestamp - 86400
                self.high_risk_questions = [
                    q for q in self.high_risk_questions if q["timestamp"] > cutoff
                ]

        # 异常模式检测
        self._detect_anomalies(question, risk_level, session_id)

    def _detect_anomalies(self, question: str, risk_level: str, session_id: str):
        """检测异常模式"""
        anomalies = []

        # 模式1：同一用户短时间内多次询问高风险问题
        if risk_level in ["high", "critical"]:
            recent = [
                q for q in self.high_risk_questions
                if q["session_id"] == session_id
                   and time.time() - q["timestamp"] < 600  # 10分钟内
            ]
            if len(recent) >= 3:
                anomalies.append({
                    "type": "frequent_high_risk",
                    "severity": "critical",
                    "description": f"用户 {session_id[:8]} 在10分钟内询问了{len(recent)}次高风险问题",
                    "recommendation": "建议管理员关注该用户，可能需要现场干预",
                    "questions": [q["question"] for q in recent]
                })

        # 模式2：询问如何绕过安全规则
        bypass_keywords = ["绕过", "规避", "跳过", "不遵守", "违反", "忽略规定"]
        if any(kw in question for kw in bypass_keywords):
            anomalies.append({
                "type": "bypass_attempt",
                "severity": "high",
                "description": f"检测到试图绕过安全规则的问题：{question}",
                "recommendation": "立即通知安全管理员"
            })

        # 模式3：危险化学品组合查询
        dangerous_combos = [
            (["硝酸", "浓硫酸"], ["乙醇", "甲醇", "丙酮"]),
            (["过氧化氢"], ["有机物", "可燃物"]),
            (["氯气"], ["氨气"]),
        ]
        for group_a, group_b in dangerous_combos:
            if any(a in question for a in group_a) and any(b in question for b in group_b):
                anomalies.append({
                    "type": "dangerous_combination",
                    "severity": "high",
                    "description": f"检测到危险化学品组合查询：{question}",
                    "recommendation": "确认用户是否了解风险，建议现场指导"
                })

        # 记录异常
        if anomalies:
            self._log_anomalies(anomalies, session_id)

    def _log_anomalies(self, anomalies: list[dict], session_id: str):
        """记录异常到日志"""
        with _LOCK:
            with _ANOMALY_LOG.open("a", encoding="utf-8") as f:
                for anomaly in anomalies:
                    record = {
                        "timestamp": datetime.now().isoformat(),
                        "session_id": session_id,
                        **anomaly
                    }
                    f.write(json.dumps(record, ensure_ascii=False) + "\n")
                    logger.warning(f"Safety anomaly detected: {anomaly['type']} - {anomaly['description']}")

    def get_daily_report(self) -> dict[str, Any]:
        """生成每日安全报告"""
        now = time.time()
        today_start = now - (now % 86400)  # 今天0点的时间戳

        with _LOCK:
            # 今日高风险问题
            today_high_risk = [
                q for q in self.high_risk_questions
                if q["timestamp"] >= today_start
            ]

            # 今日异常事件
            today_anomalies = []
            if _ANOMALY_LOG.exists():
                with _ANOMALY_LOG.open("r", encoding="utf-8") as f:
                    for line in f:
                        try:
                            record = json.loads(line)
                            record_time = datetime.fromisoformat(record["timestamp"])
                            if record_time.timestamp() >= today_start:
                                today_anomalies.append(record)
                        except:
                            continue

        return {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "high_risk_count": len(today_high_risk),
            "anomaly_count": len(today_anomalies),
            "high_risk_questions": today_high_risk[:10],  # 最多返回10条
            "anomalies": today_anomalies,
            "summary": self._generate_summary(today_high_risk, today_anomalies)
        }

    def _generate_summary(self, high_risk: list, anomalies: list) -> str:
        """生成摘要"""
        if not high_risk and not anomalies:
            return "✅ 今日无高风险问题，安全态势良好。"

        summary = f"⚠️ 今日安全概况：\n"
        summary += f"• 高风险问题：{len(high_risk)} 次\n"
        summary += f"• 异常事件：{len(anomalies)} 起\n"

        if anomalies:
            critical = [a for a in anomalies if a.get("severity") == "critical"]
            if critical:
                summary += f"• 🚨 严重异常：{len(critical)} 起，需要立即处理\n"

        return summary


# 全局监控实例
_monitor = SafetyMonitor()


def record_safety_event(question: str, risk_level: str, matched_rule_id: str, session_id: str):
    """记录安全事件（供 chat_routes.py 调用）"""
    _monitor.record_question(question, risk_level, matched_rule_id, session_id)


def get_safety_report() -> dict[str, Any]:
    """获取安全报告（供管理端调用）"""
    return _monitor.get_daily_report()


def get_realtime_alerts() -> list[dict[str, Any]]:
    """获取实时告警（最近1小时的异常）"""
    cutoff = time.time() - 3600
    alerts = []

    if _ANOMALY_LOG.exists():
        with _ANOMALY_LOG.open("r", encoding="utf-8") as f:
            for line in f:
                try:
                    record = json.loads(line)
                    record_time = datetime.fromisoformat(record["timestamp"])
                    if record_time.timestamp() >= cutoff:
                        alerts.append(record)
                except:
                    continue

    return sorted(alerts, key=lambda x: x["timestamp"], reverse=True)
