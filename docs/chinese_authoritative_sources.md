# 中国权威实验室安全资源完整清单

## 📋 资源汇总

### 一、国家级权威机构（最高优先级）

| 机构 | 官网 | 重点资源 | 可获取内容 |
|------|------|----------|------------|
| 应急管理部 | https://www.mem.gov.cn/ | 危化品目录、事故通报 | 2828种化学品、事故案例 |
| 生态环境部 | https://www.mee.gov.cn/ | 危废名录、处理标准 | 废液分类、处置规范 |
| 国家卫健委 | http://www.nhc.gov.cn/ | 生物安全管理条例 | BSL标准、病原体管理 |
| 国家标准系统 | https://openstd.samr.gov.cn/ | 全部国标免费下载 | GB标准全文PDF |

---

### 二、顶尖高校（本土化资源）

#### 🏆 清华大学实验室安全（推荐指数 ⭐⭐⭐⭐⭐）
- **官网**：http://shjy.tsinghua.edu.cn/
- **优势**：中文资料、本土案例、权威性高
- **可获取**：
  - 实验室安全手册PDF
  - 安全培训课件PPT
  - 典型事故案例（中文）
  - 安全检查标准
- **爬取难度**：⭐（简单）

---

#### 🏆 北京大学实验室与设备管理部（推荐指数 ⭐⭐⭐⭐⭐）
- **官网**：http://slab.pku.edu.cn/
- **优势**：准入考试题库（高质量问答对）
- **可获取**：
  - 实验室安全手册
  - 准入考试题库（可直接提取问答）
  - 视频培训资料
  - 分学科安全指南
- **爬取难度**：⭐（简单）

---

#### 🏆 浙江大学实验室安全管理中心（推荐指数 ⭐⭐⭐⭐⭐）
- **官网**：https://lesc.zju.edu.cn/
- **优势**：检查标准详细、案例库丰富
- **可获取**：
  - 实验室安全知识手册
  - 安全检查标准
  - 事故案例库
  - 整改案例
- **爬取难度**：⭐⭐（中等）

---

#### 复旦大学实验室安全管理办公室（推荐指数 ⭐⭐⭐⭐）
- **官网**：http://lsms.fudan.edu.cn/
- **可获取**：
  - 规章制度汇编
  - 安全教育平台资料

---

#### 上海交通大学实验室安全环保处（推荐指数 ⭐⭐⭐⭐）
- **官网**：https://lsec.sjtu.edu.cn/
- **可获取**：
  - 实验室安全手册（全学科）
  - 危化品管理系统文档

---

#### 中国科学技术大学实验室安全管理（推荐指数 ⭐⭐⭐⭐）
- **官网**：http://lsaqb.ustc.edu.cn/
- **可获取**：
  - 实验室安全知识手册
  - 培训课件PPT

---

#### 南京大学实验室安全环保办（推荐指数 ⭐⭐⭐⭐）
- **官网**：http://lsec.nju.edu.cn/
- **可获取**：
  - 实验室安全通识教程

---

#### 其他985高校
- **武汉大学**：http://lsec.whu.edu.cn/
- **华中科技大学**：http://lsaqc.hust.edu.cn/
- **西安交通大学**：http://ehs.xjtu.edu.cn/
- **哈尔滨工业大学**：http://lsec.hit.edu.cn/
- **同济大学**：http://lsec.tongji.edu.cn/

---

### 三、专业协会

| 机构 | 官网 | 重点资源 |
|------|------|----------|
| 中国化学品安全协会 | http://www.chemicalsafety.org.cn/ | 中文MSDS数据库 |
| 中国疾控中心 | https://www.chinacdc.cn/ | 职业卫生标准 |

---

## 🚀 快速实施方案

### 方案A：手动下载（1-2天，适合入门）

#### 第1步：下载清华北大手册（今天）
```
1. 访问 http://shjy.tsinghua.edu.cn/jxzy.htm
2. 下载"实验室安全手册"PDF
3. 访问 http://slab.pku.edu.cn/
4. 下载"实验室安全手册"PDF
```

#### 第2步：提取PDF内容
```python
import pdfplumber

def extract_pdf_to_qa(pdf_path):
    """从PDF提取问答对"""
    with pdfplumber.open(pdf_path) as pdf:
        text = ""
        for page in pdf.pages:
            text += page.extract_text()
    
    # 按章节分割
    sections = text.split("\n\n")
    
    qa_pairs = []
    for section in sections:
        # 提取标题作为问题
        lines = section.split("\n")
        if len(lines) >= 2:
            question = lines[0].strip()
            answer = "\n".join(lines[1:]).strip()
            
            if len(answer) > 50:  # 过滤太短的
                qa_pairs.append({
                    'question': question,
                    'answer': answer
                })
    
    return qa_pairs
```

#### 第3步：导入知识库
```python
from csv_expansion_toolkit import KnowledgeExpander
from pathlib import Path

expander = KnowledgeExpander(Path("knowledge_base_curated.csv"))

qa_pairs = extract_pdf_to_qa("清华实验室安全手册.pdf")

entries = []
for qa in qa_pairs:
    # 简化版：直接添加为通用知识
    entry = {
        "id": expander.generate_id("KB-THU"),
        "title": qa['question'],
        "question": qa['question'],
        "answer": qa['answer'],
        "source_title": "清华大学实验室安全手册",
        "source_org": "清华大学",
        "source_url": "http://shjy.tsinghua.edu.cn/",
        "reliability": "high"
    }
    entries.append(entry)

success, failed = expander.batch_import(entries)
print(f"导入成功: {success} 条")
```

**预期收获**：+200-300 条高质量中文知识

---

### 方案B：自动化爬取（3-5天，推荐）

#### 运行我给你的爬虫脚本
```bash
cd D:\lab_safe_project\lab-safe-assistant-dify-rag
python scripts/scrape_chinese_universities.py
```

这会采集：
- 清华：手册 + 案例
- 北大：手册 + 题库
- 浙大：案例库
- 应急管理部：事故通报

**预期收获**：+500-800 条资源链接

---

### 方案C：国家标准批量下载（1周，最权威）

#### 重点国标清单
```python
priority_standards = [
    # 化学安全
    ("GB 15258-2009", "化学品安全标签编写规定"),
    ("GB/T 16483-2008", "化学品安全技术说明书"),
    ("GB 30000.2-2013", "化学品分类和标签规范"),
    
    # 生物安全
    ("GB 19489-2008", "实验室生物安全通用要求"),
    ("GB 50346-2011", "生物安全实验室建筑技术规范"),
    
    # 电气安全
    ("GB/T 13869-2017", "用电安全导则"),
    ("GB 4706.1-2005", "家用和类似用途电器的安全"),
    
    # 消防安全
    ("GB 50016-2014", "建筑设计防火规范"),
    ("GB 50140-2005", "建筑灭火器配置设计规范"),
    
    # 辐射安全
    ("GB 18871-2002", "电离辐射防护与辐射源安全基本标准"),
]

# 访问 https://openstd.samr.gov.cn/
# 搜索标准号，下载PDF
# 每个标准可提取 50-200 条知识
```

**预期收获**：+1000-2000 条权威知识

---

## 📊 知识库扩充计划（3周达到5000+）

### 第1周：手动高质量资源（目标 +500）
- **Day 1-2**：下载清华、北大手册
- **Day 3-4**：提取PDF内容
- **Day 5**：导入知识库
- **成果**：3009 → 3500

---

### 第2周：自动化爬取（目标 +800）
- **Day 1**：运行爬虫脚本
- **Day 2-3**：下载PDF文件
- **Day 4-5**：批量提取和清洗
- **Day 6-7**：导入知识库
- **成果**：3500 → 4300

---

### 第3周：国标补充（目标 +700）
- **Day 1-3**：下载10个重点国标PDF
- **Day 4-5**：提取结构化内容
- **Day 6-7**：导入知识库
- **成果**：4300 → 5000+

---

## ✅ 质量保证措施

### 1. 每条知识必须包含
- ✅ 权威来源（source_title）
- ✅ 来源机构（source_org）
- ✅ 可访问链接（source_url）
- ✅ 可信度标记（reliability: high/medium）

### 2. 去重检查
```python
def check_duplicate(new_entry, existing_entries):
    """检查是否重复"""
    for exist in existing_entries:
        # 标题相似度
        from difflib import SequenceMatcher
        similarity = SequenceMatcher(None, new_entry['title'], exist['title']).ratio()
        
        if similarity > 0.85:
            return True  # 重复
    
    return False
```

### 3. 质量评分
```python
def quality_score(entry):
    """知识条目质量评分"""
    score = 0
    
    # 有权威来源 +30
    if entry.get('source_org') in ['清华大学', '北京大学', '应急管理部']:
        score += 30
    
    # 答案充实 +20
    if len(entry.get('answer', '')) > 200:
        score += 20
    
    # 有操作步骤 +15
    if entry.get('steps'):
        score += 15
    
    # 有禁止事项 +15
    if entry.get('forbidden'):
        score += 15
    
    # 有应急措施 +20
    if entry.get('emergency'):
        score += 20
    
    return score  # 满分100

# 只导入评分 ≥60 的条目
```

---

## 🎯 推荐的实施顺序

### 今天（1小时）
1. ✅ 访问清华大学网站
2. ✅ 下载"实验室安全手册"PDF
3. ✅ 手动提取10条知识测试流程

### 明天（3小时）
4. 运行爬虫脚本，采集资源链接
5. 筛选出优先级最高的20个PDF
6. 批量下载

### 本周内（10小时）
7. 提取所有PDF内容
8. 清洗和结构化
9. 导入知识库
10. 测试回答质量

---

## 📞 需要我帮你

1. **现在就运行爬虫脚本**？
2. **演示如何从PDF提取结构化内容**？
3. **写一个完整的导入流程**？
4. **准备一份给导师的数据来源报告**（证明权威性）？

选一个，我立即帮你实现！🚀
