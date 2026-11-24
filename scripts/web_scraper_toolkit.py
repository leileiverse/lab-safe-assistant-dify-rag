"""
web_scraper_toolkit.py - 自动化爬虫工具集

从权威网站批量爬取实验室安全知识
支持的数据源：
1. OSHA (美国职业安全健康管理局)
2. CDC/NIOSH (疾病控制中心)
3. 中国化学品安全协会
4. 各大高校实验室安全手册
"""
from __future__ import annotations

import logging
import re
import time
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class SafetyKnowledgeScraper:
    """实验室安全知识爬虫"""

    def __init__(self, delay: float = 1.0):
        self.delay = delay  # 请求间隔，避免被封
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def _fetch_page(self, url: str) -> str | None:
        """获取网页内容"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            time.sleep(self.delay)
            return response.text
        except Exception as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return None

    def scrape_osha_chemical_data(self, chemical_name: str) -> dict[str, Any] | None:
        """
        从OSHA网站爬取化学品数据

        URL示例: https://www.osha.gov/chemicaldata/
        """
        # 构造搜索URL
        search_url = f"https://www.osha.gov/chemicaldata/{chemical_name.lower()}"
        html = self._fetch_page(search_url)

        if not html:
            return None

        soup = BeautifulSoup(html, "html.parser")

        data = {
            "chemical_name": chemical_name,
            "source": "OSHA",
            "source_url": search_url,
        }

        # 提取危险性信息
        hazards_section = soup.find("div", {"id": "hazards"})
        if hazards_section:
            hazards = [h.get_text(strip=True) for h in hazards_section.find_all("li")]
            data["hazards"] = hazards

        # 提取防护要求
        ppe_section = soup.find("div", {"id": "ppe"})
        if ppe_section:
            data["ppe"] = ppe_section.get_text(strip=True)

        # 提取应急措施
        emergency_section = soup.find("div", {"id": "emergency"})
        if emergency_section:
            data["emergency"] = emergency_section.get_text(strip=True)

        return data

    def scrape_university_safety_manual(self, university_url: str) -> list[dict[str, Any]]:
        """
        爬取大学实验室安全手册

        支持的格式：
        - HTML页面
        - PDF链接（需要额外处理）
        """
        html = self._fetch_page(university_url)
        if not html:
            return []

        soup = BeautifulSoup(html, "html.parser")
        entries = []

        # 查找所有安全指南链接
        for link in soup.find_all("a", href=True):
            href = link["href"]
            text = link.get_text(strip=True)

            # 过滤出实验室安全相关链接
            if any(kw in text.lower() for kw in ["safety", "sop", "protocol", "guideline", "安全", "规程"]):
                full_url = urljoin(university_url, href)

                entry = {
                    "title": text,
                    "source_url": full_url,
                    "source_type": "university_manual",
                    "category": self._classify_topic(text)
                }
                entries.append(entry)

        return entries

    def _classify_topic(self, text: str) -> str:
        """根据标题自动分类"""
        text_lower = text.lower()

        if any(kw in text_lower for kw in ["chemical", "化学品", "试剂"]):
            return "化学品安全"
        elif any(kw in text_lower for kw in ["biological", "生物", "病原体"]):
            return "生物安全"
        elif any(kw in text_lower for kw in ["electrical", "电气", "电路"]):
            return "电气安全"
        elif any(kw in text_lower for kw in ["radiation", "辐射", "放射"]):
            return "辐射防护"
        elif any(kw in text_lower for kw in ["fire", "消防", "灭火"]):
            return "消防安全"
        elif any(kw in text_lower for kw in ["ppe", "防护", "手套", "护目镜"]):
            return "个人防护"
        elif any(kw in text_lower for kw in ["waste", "废弃物", "废液"]):
            return "废弃物处理"
        else:
            return "实验室通用安全"

    def scrape_incident_reports(self, base_url: str) -> list[dict[str, Any]]:
        """
        爬取实验室事故报告

        示例来源：
        - CSB (美国化学安全委员会) 事故报告
        - 高校公开的事故通报
        """
        html = self._fetch_page(base_url)
        if not html:
            return []

        soup = BeautifulSoup(html, "html.parser")
        incidents = []

        # 查找事故列表
        for article in soup.find_all(["article", "div"], class_=re.compile(r"incident|accident|case")):
            title_elem = article.find(["h1", "h2", "h3", "h4"])
            if not title_elem:
                continue

            title = title_elem.get_text(strip=True)

            # 提取日期
            date_match = re.search(r"\d{4}-\d{2}-\d{2}|\d{4}年\d{1,2}月\d{1,2}日", article.get_text())
            incident_date = date_match.group(0) if date_match else ""

            # 提取摘要
            summary_elem = article.find("p")
            summary = summary_elem.get_text(strip=True) if summary_elem else ""

            incident = {
                "title": title,
                "incident_date": incident_date,
                "summary": summary[:500],  # 限制长度
                "source_url": urljoin(base_url, article.find("a")["href"]) if article.find("a") else base_url,
            }
            incidents.append(incident)

        return incidents

    def extract_sop_from_pdf_url(self, pdf_url: str) -> dict[str, Any] | None:
        """
        从PDF URL提取SOP信息

        注意：需要安装 PyPDF2 或 pdfplumber
        这里只返回元数据，实际内容提取需要额外处理
        """
        return {
            "source_url": pdf_url,
            "source_type": "pdf",
            "note": "PDF content extraction requires additional processing"
        }


# ========== 批量爬取脚本 ==========

def batch_scrape_chemicals(chemical_list: list[str]) -> list[dict[str, Any]]:
    """批量爬取化学品数据"""
    scraper = SafetyKnowledgeScraper(delay=2.0)  # 2秒间隔
    results = []

    for chemical in chemical_list:
        logger.info(f"Scraping data for: {chemical}")
        data = scraper.scrape_osha_chemical_data(chemical)
        if data:
            results.append(data)
        time.sleep(2)  # 额外等待

    return results


def batch_scrape_universities(university_urls: list[str]) -> list[dict[str, Any]]:
    """批量爬取大学安全手册"""
    scraper = SafetyKnowledgeScraper(delay=2.0)
    all_entries = []

    for url in university_urls:
        logger.info(f"Scraping university safety manual: {url}")
        entries = scraper.scrape_university_safety_manual(url)
        all_entries.extend(entries)
        time.sleep(3)

    return all_entries


# ========== 使用示例 ==========

if __name__ == "__main__":
    # 示例1: 爬取常见化学品
    common_chemicals = [
        "sulfuric acid",  # 硫酸
        "hydrochloric acid",  # 盐酸
        "acetone",  # 丙酮
        "ethanol",  # 乙醇
        "hydrogen peroxide",  # 过氧化氢
    ]

    print("Scraping chemical data...")
    chemical_data = batch_scrape_chemicals(common_chemicals)
    print(f"Scraped {len(chemical_data)} chemicals")

    # 示例2: 爬取大学安全手册
    university_safety_urls = [
        "https://ehs.stanford.edu/reference/lab-safety-guides",
        "https://www.ehs.harvard.edu/programs/laboratory-safety",
        "https://research.cornell.edu/research-safety",
    ]

    print("Scraping university manuals...")
    manual_entries = batch_scrape_universities(university_safety_urls)
    print(f"Found {len(manual_entries)} safety manual entries")

    # 示例3: 结合csv_expansion_toolkit.py保存到CSV
    from csv_expansion_toolkit import KnowledgeExpander
    from pathlib import Path

    expander = KnowledgeExpander(Path("knowledge_base_curated.csv"))

    # 将爬取的化学品数据转换为KB条目
    entries = []
    for chem_data in chemical_data:
        entry = expander.add_chemical_safety(
            chemical_name=chem_data["chemical_name"],
            hazards=chem_data.get("hazards", []),
            emergency=chem_data.get("emergency", ""),
            source_url=chem_data["source_url"]
        )
        entries.append(entry)

    success, failed = expander.batch_import(entries)
    print(f"Imported {success} entries to CSV")
