"""
PDF内容提取工具 - 从权威文档中提取结构化知识

支持：
1. 清华/北大等高校手册
2. 国家标准PDF
3. 事故通报PDF
"""
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("需要安装 pdfplumber: pip install pdfplumber")
    sys.exit(1)

import re
import json


def extract_qa_from_handbook(pdf_path):
    """
    从实验室安全手册中提取问答对

    适用于：清华、北大等高校手册
    """
    results = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()

            if not text:
                continue

            # 按章节分割
            # 常见模式：数字开头的标题
            sections = re.split(r'\n(\d+[\.\、][\s]*[^\n]+)\n', text)

            for i in range(1, len(sections), 2):
                if i + 1 < len(sections):
                    title = sections[i].strip()
                    content = sections[i + 1].strip()

                    # 过滤太短的内容
                    if len(content) > 100:
                        results.append({
                            'title': title,
                            'question': f"{title}的安全要求是什么？",
                            'answer': content[:500],  # 限制长度
                            'page': page_num,
                            'type': 'handbook_section'
                        })

    return results


def extract_from_national_standard(pdf_path):
    """
    从国家标准中提取知识

    适用于：GB标准PDF
    """
    results = []

    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

        # 国标通常有明确的条款编号
        # 例如：4.1.1、5.2.3
        clauses = re.findall(r'(\d+\.\d+(?:\.\d+)?)\s+([^\n]+)\n([^\d]+?)(?=\n\d+\.\d+|\Z)', full_text, re.DOTALL)

        for clause_num, title, content in clauses:
            content_clean = content.strip()

            if len(content_clean) > 50:
                results.append({
                    'clause': clause_num,
                    'title': title.strip(),
                    'question': f"{title.strip()}的标准要求？",
                    'answer': content_clean[:500],
                    'type': 'national_standard'
                })

    return results


def extract_accident_case(pdf_path):
    """
    从事故报告中提取案例

    适用于：应急管理部事故通报
    """
    results = []

    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

        # 提取事故信息
        # 时间
        date_match = re.search(r'(\d{4})年(\d{1,2})月(\d{1,2})日', full_text)
        date = f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}" if date_match else ""

        # 地点
        location_match = re.search(r'([一-龥]+(?:大学|学院|研究所|实验室))', full_text)
        location = location_match.group(1) if location_match else ""

        # 原因
        cause_section = re.search(r'(?:事故原因|直接原因)[：:](.*?)(?:事故后果|教训|建议|\n\n)', full_text, re.DOTALL)
        cause = cause_section.group(1).strip()[:300] if cause_section else ""

        # 后果
        consequence_section = re.search(r'(?:事故后果|伤亡情况)[：:](.*?)(?:原因|教训|建议|\n\n)', full_text, re.DOTALL)
        consequence = consequence_section.group(1).strip()[:300] if consequence_section else ""

        if date and location:
            results.append({
                'date': date,
                'location': location,
                'cause': cause,
                'consequence': consequence,
                'type': 'accident_case'
            })

    return results


def batch_process_pdfs(pdf_directory):
    """批量处理PDF文件"""
    pdf_dir = Path(pdf_directory)

    if not pdf_dir.exists():
        print(f"目录不存在: {pdf_dir}")
        return

    all_results = {
        'handbooks': [],
        'standards': [],
        'accidents': []
    }

    for pdf_file in pdf_dir.glob("*.pdf"):
        print(f"\n处理: {pdf_file.name}")

        try:
            # 根据文件名判断类型
            if 'handbook' in pdf_file.name.lower() or '手册' in pdf_file.name:
                results = extract_qa_from_handbook(pdf_file)
                all_results['handbooks'].extend(results)
                print(f"  提取手册内容: {len(results)} 条")

            elif 'gb' in pdf_file.name.lower() or '标准' in pdf_file.name:
                results = extract_from_national_standard(pdf_file)
                all_results['standards'].extend(results)
                print(f"  提取标准条款: {len(results)} 条")

            elif 'accident' in pdf_file.name.lower() or '事故' in pdf_file.name:
                results = extract_accident_case(pdf_file)
                all_results['accidents'].extend(results)
                print(f"  提取事故案例: {len(results)} 条")

            else:
                # 默认按手册处理
                results = extract_qa_from_handbook(pdf_file)
                all_results['handbooks'].extend(results)
                print(f"  提取内容: {len(results)} 条")

        except Exception as e:
            print(f"  错误: {e}")

    # 保存结果
    output_file = pdf_dir.parent / "extracted_knowledge.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)

    # 统计
    total = sum(len(v) for v in all_results.values())
    print(f"\n=== 提取完成 ===")
    print(f"总计: {total} 条")
    print(f"  手册: {len(all_results['handbooks'])} 条")
    print(f"  标准: {len(all_results['standards'])} 条")
    print(f"  案例: {len(all_results['accidents'])} 条")
    print(f"\n保存到: {output_file}")

    return all_results


# ========== 使用示例 ==========

if __name__ == "__main__":
    # 创建PDF存放目录
    pdf_dir = Path("data_sources/pdfs")
    pdf_dir.mkdir(parents=True, exist_ok=True)

    print("PDF提取工具")
    print("=" * 50)
    print(f"\n请将PDF文件放到: {pdf_dir.absolute()}")
    print("\n文件命名建议:")
    print("  - 手册: tsinghua_handbook.pdf, pku_handbook.pdf")
    print("  - 标准: GB15258-2009.pdf, GB19489-2008.pdf")
    print("  - 事故: accident_2015_tsinghua.pdf")
    print("\n然后重新运行此脚本")
    print("=" * 50)

    # 检查是否有PDF文件
    pdf_files = list(pdf_dir.glob("*.pdf"))

    if pdf_files:
        print(f"\n发现 {len(pdf_files)} 个PDF文件，开始处理...")
        results = batch_process_pdfs(pdf_dir)
    else:
        print("\n未找到PDF文件，请先下载并放入上述目录")
