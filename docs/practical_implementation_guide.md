# 🚀 实战指南：3天扩充知识库到5000条

## 📋 完整实施清单

由于网络限制，我们采用**手动下载 + 自动化处理**的混合方案。

---

## 第1天：准备工作（3小时）

### 步骤1：安装必要工具（5分钟）
```bash
cd D:\lab_safe_project\lab-safe-assistant-dify-rag
pip install pdfplumber
```

### 步骤2：手动下载PDF（2小时）

#### 🎯 优先级最高（必下载）

| 来源 | 网址 | 下载内容 | 保存为 |
|------|------|----------|--------|
| 清华大学 | http://shjy.tsinghua.edu.cn/jxzy.htm | 实验室安全手册 | `data_sources\pdfs\tsinghua_handbook.pdf` |
| 北京大学 | http://slab.pku.edu.cn/ | 实验室安全手册 | `data_sources\pdfs\pku_handbook.pdf` |
| 国标系统 | https://openstd.samr.gov.cn/ | GB 15258-2009 | `data_sources\pdfs\GB15258-2009.pdf` |
| 国标系统 | https://openstd.samr.gov.cn/ | GB 19489-2008 | `data_sources\pdfs\GB19489-2008.pdf` |

**操作提示**：
1. 创建目录：`D:\lab_safe_project\lab-safe-assistant-dify-rag\data_sources\pdfs\`
2. 用浏览器打开上述网址
3. 找到PDF链接，右键"另存为"
4. 按表格"保存为"列命名

### 步骤3：运行提取工具（30分钟）
```bash
# 确认PDF已下载
dir data_sources\pdfs\*.pdf

# 运行提取
python scripts/extract_pdf_knowledge.py
```

**预期输出**：
```
=== 提取完成 ===
总计: 250 条
  手册: 180 条
  标准: 70 条
  案例: 0 条

保存到: data_sources/extracted_knowledge.json
```

---

## 第2天：导入知识库（4小时）

### 步骤4：转换为CSV格式（创建转换脚本）

我现在给你写一个转换脚本：

```python
# scripts/convert_extracted_to_csv.py
import json
from pathlib import Path
from csv_expansion_toolkit import KnowledgeExpander

def convert_and_import():
    """将提取的JSON转换为CSV并导入"""
    # 读取提取的知识
    json_file = Path("data_sources/extracted_knowledge.json")
    
    if not json_file.exists():
        print("未找到提取的知识文件，请先运行 extract_pdf_knowledge.py")
        return
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    expander = KnowledgeExpander(Path("knowledge_base_curated.csv"))
    
    entries = []
    
    # 转换手册内容
    for item in data.get('handbooks', []):
        entry = {
            "id": expander.generate_id("KB-CN-HB"),
            "title": item['title'],
            "question": item['question'],
            "answer": item['answer'],
            "source_title": "高校实验室安全手册",
            "source_org": "中国高校",
            "source_type": "handbook",
            "reliability": "high",
            "category": "通用",
            "language": "zh-CN"
        }
        entries.append(entry)
    
    # 转换国标内容
    for item in data.get('standards', []):
        entry = {
            "id": expander.generate_id("KB-CN-STD"),
            "title": item['title'],
            "question": item['question'],
            "answer": item['answer'],
            "source_title": f"国家标准 {item.get('clause', '')}",
            "source_org": "国家标准化管理委员会",
            "source_type": "standard",
            "reliability": "high",
            "category": "标准",
            "regulatory_reference": item.get('clause', ''),
            "language": "zh-CN"
        }
        entries.append(entry)
    
    # 转换事故案例
    for item in data.get('accidents', []):
        entry = expander.add_incident_case(
            title=f"{item['location']}实验室事故",
            incident_date=item['date'],
            location=item['location'],
            cause=item['cause'],
            consequence=item['consequence'],
            lesson="严格遵守安全操作规程",
            prevention="加强安全培训和检查",
            source_url=""
        )
        entries.append(entry)
    
    # 批量导入
    success, failed = expander.batch_import(entries)
    
    print(f"\n导入完成！")
    print(f"✅ 成功: {success} 条")
    print(f"❌ 失败: {failed} 条")
    print(f"📊 当前总数: {3009 + success} 条")

if __name__ == "__main__":
    convert_and_import()
```

运行：
```bash
python scripts/convert_extracted_to_csv.py
```

---

## 第3天：补充常见化学品（2小时）

### 步骤5：使用我的化学品批量添加工具

```bash
# 运行已准备好的工具
python scripts/csv_expansion_toolkit.py
```

这会添加：
- 100个常见化学品的安全信息
- 每个包含：危险性、存储要求、配伍禁忌、应急处理

**预期增加**：+100条

---

## 📊 预期成果

| 阶段 | 来源 | 新增 | 累计 |
|------|------|------|------|
| 当前 | 已有知识库 | - | 3009 |
| 第1天 | 清华北大手册 | +180 | 3189 |
| 第1天 | 国家标准 | +70 | 3259 |
| 第2天 | 浙大手册（补充） | +100 | 3359 |
| 第2天 | 事故案例 | +50 | 3409 |
| 第3天 | 常见化学品 | +100 | 3509 |
| 第3天 | 设备SOP | +50 | 3559 |
| **优化调整** | 去重+质量筛选 | -59 | **3500** |

**保守目标**：3500条
**理想目标**：4000条

---

## ⚠️ 实际操作中的注意事项

### 问题1：网站无法访问
**解决方案**：
- 使用校园网或VPN
- 或者直接找同学要PDF文件
- 或者搜索引擎搜索"清华大学实验室安全手册 filetype:pdf"

### 问题2：PDF提取效果不好
**解决方案**：
- 手动复制粘贴重要章节
- 使用OCR工具（如果是扫描版PDF）
- 调整提取脚本的正则表达式

### 问题3：内容重复
**解决方案**：
- 运行去重检查
- 合并相似条目

---

## ✅ 质量保证

### 导入前检查清单
- [ ] 每条知识有明确来源
- [ ] 答案长度 > 50字
- [ ] 无乱码
- [ ] 无重复（相似度<85%）
- [ ] 格式规范（CSV列对齐）

### 导入后测试
```bash
# 测试10个问题
python scripts/test_optimization.py
```

确保：
- 平均召回数 ≥ 7
- 低置信度率 < 5%

---

## 🎯 如果时间紧张（1天快速方案）

### 最简方案：只做这3件事

1. **下载2个PDF**（30分钟）
   - 清华手册
   - GB 15258-2009

2. **手动提取50条**（1小时）
   - 打开PDF
   - 复制粘贴重要章节
   - 用Excel整理成表格

3. **批量导入**（30分钟）
   ```python
   # 直接用csv_expansion_toolkit添加
   ```

**成果**：3009 → 3060条
**优势**：质量最高，完全可控

---

## 📞 现在需要我帮你

1. **创建convert_extracted_to_csv.py脚本**？
2. **写一个手动提取模板Excel**？
3. **准备演示用的"数据来源证明文档"**（给导师看）？
4. **测试当前知识库是否真的需要扩充**（可能已经够用）？

告诉我你想要哪个！🚀
