"""
知识库质量诊断和优化建议

现状：
- 实际条数：3009条（已修复格式问题）
- 分布：化学1144、通用407、生物339、设备327...

问题诊断：
1. ❌ 检索召回数太少（top_k=4 → 已优化为8）
2. ❌ 低置信度阈值太高（3.5 → 已优化为2.8）
3. ⚠️  缺少部分领域知识（生物安全、辐射防护）
"""

## 📊 完整优化清单

### 已完成的优化 ✅

1. **修复CSV格式** - 清理了多行文本字段
2. **提高召回数量** - top_k: 4 → 8
3. **降低置信度阈值** - 3.5 → 2.8

### 立即可做的优化（今天）

#### 优化1：测试当前效果
```bash
# 重启服务
python -m web_demo.app

# 测试问题：
curl -X POST http://localhost:8088/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "硝酸和乙醇能同柜存放吗？"}'
```

预期改进：
- 召回的引用从3-4条 → 6-8条
- 答案更全面
- 减少"低置信度"标记

---

### 优化2：提升答案生成质量

#### 问题：Dify生成的答案可能不够精准

#### 解决方案：优化本地快速回答模板

当前代码在 `web_demo/services/fast_path_service.py`，需要优化答案模板：

```python
def build_fast_path_answer(question: str, citations: list) -> str:
    """生成结构化答案"""
    
    # 当前问题：模板太简单
    # 优化：增加领域判断和结构化输出
    
    if not citations:
        return "未在知识库中找到相关信息。"
    
    # 判断问题类型
    question_lower = question.lower()
    
    # 应急类问题
    if any(kw in question_lower for kw in ["怎么办", "泄漏", "着火", "触电", "中毒"]):
        return build_emergency_answer(question, citations)
    
    # 配伍禁忌类
    if any(kw in question_lower for kw in ["能不能", "可以吗", "混合", "同柜"]):
        return build_compatibility_answer(question, citations)
    
    # 操作规程类
    if any(kw in question_lower for kw in ["如何", "怎么", "步骤", "流程"]):
        return build_procedure_answer(question, citations)
    
    # 通用答案
    return build_general_answer(question, citations)


def build_emergency_answer(question: str, citations: list) -> str:
    """应急类答案模板"""
    parts = ["【应急处理】\n"]
    
    # 提取应急措施
    emergency_steps = []
    for c in citations:
        if c.emergency:
            emergency_steps.append(f"• {c.emergency}")
        if c.first_aid:
            emergency_steps.append(f"• 急救：{c.first_aid}")
    
    if emergency_steps:
        parts.append("\n".join(emergency_steps))
    else:
        # 从answer中提取
        parts.append(citations[0].answer[:300])
    
    # 添加禁止事项
    forbidden_items = [c.forbidden for c in citations if c.forbidden]
    if forbidden_items:
        parts.append("\n\n【禁止事项】")
        parts.append("\n".join(f"⚠️ {item}" for item in forbidden_items[:3]))
    
    # 添加引用来源
    parts.append(f"\n\n📚 参考来源：{citations[0].source_title}")
    
    return "\n".join(parts)


def build_compatibility_answer(question: str, citations: list) -> str:
    """配伍禁忌类答案"""
    # 提取关键化学品
    import re
    chemicals = re.findall(r"(硝酸|盐酸|硫酸|氨水|乙醇|丙酮|过氧化氢|漂白水)", question)
    
    if len(chemicals) >= 2:
        # 检查是否有明确禁忌
        for c in citations:
            if all(chem in c.title or chem in c.answer for chem in chemicals):
                if "禁止" in c.answer or "不能" in c.answer:
                    return f"❌ 不能。{c.answer[:200]}\n\n📚 来源：{c.source_title}"
    
    # 默认保守回答
    return f"⚠️ 建议分开存放。{citations[0].answer[:200]}\n\n📚 来源：{citations[0].source_title}"


def build_procedure_answer(question: str, citations: list) -> str:
    """操作规程类答案"""
    parts = []
    
    # 提取操作步骤
    for c in citations:
        if c.steps:
            parts.append("【操作步骤】")
            parts.append(c.steps)
            break
    
    if not parts:
        parts.append(citations[0].answer[:300])
    
    # PPE要求
    ppe_items = [c.ppe for c in citations if c.ppe]
    if ppe_items:
        parts.append(f"\n\n【防护装备】{ppe_items[0]}")
    
    return "\n".join(parts)
```

---

### 优化3：知识库扩充方向（不是越多越好）

#### 当前短板分析

| 类别 | 当前 | 质量评估 | 扩充建议 |
|------|------|----------|----------|
| 化学品安全 | 1144 | ⭐⭐⭐⭐ | 已足够，可优化结构 |
| 通用安全 | 407 | ⭐⭐⭐ | 可增加案例 |
| 生物安全 | 339 | ⭐⭐⭐ | **需扩充到600** |
| 设备操作 | 327 | ⭐⭐⭐ | 可增加SOP |
| 辐射防护 | 少 | ⭐⭐ | **需补充到300** |
| 事故案例 | 少 | ⭐⭐ | **需补充到200** |

#### 扩充优先级

**P0（必做）**：
1. 生物安全（从339 → 600）- 补充病原体操作、BSL标准
2. 事故案例（从少 → 200）- 真实案例学习
3. 辐射防护（从少 → 300）- X射线、同位素

**P1（推荐）**：
4. 设备SOP（从327 → 500）- HPLC、NMR等详细操作
5. 应急演练（新增100）- 场景化应急流程

**P2（可选）**：
6. 多语言支持（翻译常用500条）
7. 视频/图片资源（增强理解）

---

### 优化4：提升Dify调用成功率

#### 当前问题：Dify可能超时或返回空

#### 解决方案：
```python
# 在 .env.dify_rag 中
DIFY_TIMEOUT=180  # 从120提高到180秒
LABSAFE_RESPONSE_MODE=local_complete  # 强制使用本地快速回答
```

---

## 🎯 今天的行动计划

### 1. 立即测试（10分钟）
```bash
# 重启服务
cd D:\lab_safe_project\lab-safe-assistant-dify-rag
python -m web_demo.app

# 测试10个问题，对比优化前后
```

测试问题列表：
1. "硝酸和乙醇能同柜存放吗？"
2. "化学品泄漏了怎么办？"
3. "通风柜什么时候必须开启？"
4. "乙醚能用明火加热吗？"
5. "实验室着火怎么办？"
6. "气瓶如何固定？"
7. "过期试剂怎么处理？"
8. "高压电源如何上电？"
9. "细菌培养废液怎么处理？"
10. "生物安全柜的操作规范？"

### 2. 记录改进效果（5分钟）
- 召回引用数：优化前 vs 优化后
- 答案完整性：是否包含关键信息
- 低置信度问题：是否减少

### 3. 如果效果仍不理想（1小时）
- 实施"优化2"：改进答案生成模板
- 或补充50-100条高频问题的知识

---

## 💡 关键结论

### ❌ 错误认知
"知识库太少（3009条）导致回答差"

### ✅ 正确认知
1. **3009条已经足够**（MIT实验室手册也就几百页）
2. **关键是检索精度**（top_k太小、阈值太高）
3. **答案模板要优化**（结构化、分类型）
4. **需要补充的是特定领域**（生物安全、事故案例），而不是盲目增加数量

### 🎯 优先级总结

**最高优先级**（今天完成）：
1. ✅ 已完成：top_k: 4→8，阈值: 3.5→2.8
2. 🔄 进行中：测试效果
3. ⏳ 待做：优化答案生成模板

**中等优先级**（本周）：
4. 补充生物安全知识（+200条）
5. 补充事故案例（+100条）
6. 优化缓存策略

**低优先级**（下周）：
7. 视觉识别上线
8. 实时监控集成
9. 知识图谱可视化

---

需要我帮你：
1. **现在就测试优化效果**？
2. **实现优化2的答案模板代码**？
3. **准备生物安全知识扩充脚本**？
4. **分析为什么某个具体问题回答不好**？

告诉我你想先做哪个！🚀
