"""
修复 knowledge_base_curated.csv 的格式问题
"""
import csv
import re
from pathlib import Path

def fix_csv_format():
    """修复CSV中的多行文本和格式错误"""
    csv_path = Path("knowledge_base_curated.csv")
    backup_path = Path("knowledge_base_curated_backup.csv")

    # 备份原文件
    import shutil
    shutil.copy(csv_path, backup_path)
    print(f"Backup created: {backup_path}")

    # 读取并修复
    fixed_rows = []
    with open(csv_path, 'r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames

        for i, row in enumerate(reader, start=1):
            # 检查必要字段
            if not row.get('id') or not row.get('title'):
                print(f"Warning: Skip malformed row {i}: {row.get('id', 'NO_ID')}")
                continue

            # 清理多行文本字段
            for key in ['answer', 'steps', 'question', 'emergency', 'forbidden']:
                if key in row and row[key]:
                    # 替换换行符为空格，保持文本连贯
                    row[key] = re.sub(r'\s+', ' ', row[key]).strip()

            # 确保所有字段都存在
            for header in headers:
                if header not in row:
                    row[header] = ''

            fixed_rows.append(row)

    # 写回修复后的数据
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(fixed_rows)

    print(f"\nFix completed!")
    print(f"Original rows: {i}")
    print(f"Valid rows: {len(fixed_rows)}")
    print(f"Lost rows: {i - len(fixed_rows)}")

    return len(fixed_rows)

if __name__ == "__main__":
    count = fix_csv_format()
    print(f"\nCurrent knowledge base entries: {count}")
