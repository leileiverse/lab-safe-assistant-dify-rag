"""
测试脚本：评估优化效果

测试10个典型问题，评估：
1. 召回的引用数量
2. 答案质量
3. 低置信度标记情况
"""
import sys
import os

# 设置UTF-8输出
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

sys.path.insert(0, '.')

from web_demo.services.kb_service import retrieve_citations
from web_demo.services.fast_path_service import build_fast_path_answer

# 测试问题列表
test_questions = [
    {
        "id": 1,
        "question": "硝酸和乙醇能同柜存放吗？",
        "category": "配伍禁忌",
        "expected": "应该明确回答不能，并解释原因"
    },
    {
        "id": 2,
        "question": "化学品泄漏了怎么办？",
        "category": "应急处理",
        "expected": "应包含疏散、处理步骤、报告流程"
    },
    {
        "id": 3,
        "question": "通风柜什么时候必须开启？",
        "category": "设备操作",
        "expected": "挥发性、有毒操作时必须开启"
    },
    {
        "id": 4,
        "question": "乙醚能用明火加热吗？",
        "category": "危险操作",
        "expected": "明确禁止，说明易燃风险"
    },
    {
        "id": 5,
        "question": "实验室着火怎么办？",
        "category": "应急处理",
        "expected": "停止实验、切断电源、灭火或撤离"
    },
    {
        "id": 6,
        "question": "气瓶如何固定？",
        "category": "设备管理",
        "expected": "链条或支架固定、远离热源"
    },
    {
        "id": 7,
        "question": "过期试剂怎么处理？",
        "category": "废弃物处理",
        "expected": "不能随意丢弃，按危废处置"
    },
    {
        "id": 8,
        "question": "高压电源如何上电？",
        "category": "电气安全",
        "expected": "检查接地、双人确认、逐步上电"
    },
    {
        "id": 9,
        "question": "细菌培养废液怎么处理？",
        "category": "生物安全",
        "expected": "灭活后按生物危废处置"
    },
    {
        "id": 10,
        "question": "配制硫酸溶液时先加什么？",
        "category": "化学操作",
        "expected": "先加水后加酸，避免飞溅"
    }
]

print("="*80)
print("实验室安全助手 - 优化效果测试")
print("="*80)
print()

results = []

for test in test_questions:
    print(f"\n{'='*80}")
    print(f"测试 #{test['id']}: {test['question']}")
    print(f"类别: {test['category']}")
    print(f"预期: {test['expected']}")
    print("-"*80)

    # 检索知识库
    citations = retrieve_citations(test['question'], top_k=8)

    # 统计结果
    citation_count = len(citations)
    top_score = max(c.score for c in citations) if citations else 0

    print(f"\n📊 检索结果:")
    print(f"  召回数量: {citation_count}")
    print(f"  最高分数: {top_score:.2f}")
    print(f"  低置信度: {'是' if top_score < 2.8 else '否'}")

    # 显示前3个引用
    print(f"\n📚 引用来源 (前3条):")
    for i, cite in enumerate(citations[:3], 1):
        print(f"  {i}. [{cite.kb_id}] {cite.title}")
        print(f"     分数: {cite.score:.2f}")
        print(f"     来源: {cite.source_title[:50]}")

    # 生成答案
    if citations:
        answer = build_fast_path_answer(test['question'], citations)
        print(f"\n💬 生成的答案:")
        print(f"  {answer[:300]}...")
    else:
        answer = "未找到相关知识"
        print(f"\n💬 生成的答案: {answer}")

    # 评估
    result = {
        "id": test['id'],
        "question": test['question'],
        "category": test['category'],
        "citation_count": citation_count,
        "top_score": top_score,
        "low_confidence": top_score < 2.8,
        "answer_length": len(answer),
        "has_citations": citation_count > 0
    }
    results.append(result)

# 汇总统计
print("\n" + "="*80)
print("📈 测试汇总统计")
print("="*80)

total = len(results)
avg_citations = sum(r['citation_count'] for r in results) / total
avg_score = sum(r['top_score'] for r in results) / total
low_conf_count = sum(1 for r in results if r['low_confidence'])
zero_citation_count = sum(1 for r in results if r['citation_count'] == 0)

print(f"\n总测试数: {total}")
print(f"平均召回数: {avg_citations:.1f} 条")
print(f"平均最高分: {avg_score:.2f}")
print(f"低置信度问题: {low_conf_count}/{total} ({low_conf_count/total*100:.1f}%)")
print(f"零召回问题: {zero_citation_count}/{total} ({zero_citation_count/total*100:.1f}%)")

# 按类别统计
print(f"\n📊 按类别统计:")
from collections import defaultdict
category_stats = defaultdict(list)
for r in results:
    category_stats[r['category']].append(r['citation_count'])

for cat, counts in category_stats.items():
    avg = sum(counts) / len(counts)
    print(f"  {cat}: 平均召回 {avg:.1f} 条")

# 优化效果评估
print(f"\n✅ 优化效果评估:")
print(f"  召回数量: {'优秀' if avg_citations >= 6 else '良好' if avg_citations >= 4 else '需改进'} (目标≥6)")
print(f"  匹配精度: {'优秀' if avg_score >= 10 else '良好' if avg_score >= 5 else '需改进'} (目标≥10)")
print(f"  低置信率: {'优秀' if low_conf_count <= 2 else '良好' if low_conf_count <= 5 else '需改进'} (目标≤20%)")

print("\n" + "="*80)
print("测试完成！")
print("="*80)
