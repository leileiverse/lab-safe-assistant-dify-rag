"""
中国高校和机构实验室安全资源自动化采集工具

支持的来源：
1. 清华大学
2. 北京大学
3. 浙江大学
4. 应急管理部
5. 国家标准系统
"""
import requests
from bs4 import BeautifulSoup
import time
import json
from pathlib import Path
from urllib.parse import urljoin
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChineseUniversityScraper:
    """中国高校实验室安全资源爬虫"""

    def __init__(self, output_dir="data_sources/chinese_universities"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })

    def scrape_tsinghua(self):
        """爬取清华大学实验室安全资源"""
        logger.info("Scraping Tsinghua University...")

        base_url = "http://shjy.tsinghua.edu.cn"
        results = []

        # 1. 爬取教学资源（安全手册）
        try:
            response = self.session.get(f"{base_url}/jxzy.htm", timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')

            for item in soup.find_all('li', class_='list_item'):
                link = item.find('a')
                if link:
                    title = link.text.strip()
                    href = link.get('href', '')

                    if href:
                        full_url = urljoin(base_url, href)
                        results.append({
                            'title': title,
                            'url': full_url,
                            'source': '清华大学实验室安全',
                            'type': 'handbook',
                            'category': '实验室安全手册'
                        })
        except Exception as e:
            logger.error(f"Failed to scrape Tsinghua handbooks: {e}")

        # 2. 爬取事故案例
        try:
            response = self.session.get(f"{base_url}/sgal.htm", timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')

            for item in soup.find_all('li', class_='list_item'):
                link = item.find('a')
                if link:
                    title = link.text.strip()
                    href = link.get('href', '')

                    if href and "事故" in title:
                        full_url = urljoin(base_url, href)
                        results.append({
                            'title': title,
                            'url': full_url,
                            'source': '清华大学实验室安全',
                            'type': 'case_study',
                            'category': '事故案例'
                        })
        except Exception as e:
            logger.error(f"Failed to scrape Tsinghua cases: {e}")

        # 保存结果
        output_file = self.output_dir / "tsinghua_resources.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        logger.info(f"Tsinghua: Found {len(results)} resources")
        return results

    def scrape_pku(self):
        """爬取北京大学实验室安全资源"""
        logger.info("Scraping Peking University...")

        base_url = "http://slab.pku.edu.cn"
        results = []

        # 1. 爬取安全教育资源
        try:
            response = self.session.get(f"{base_url}/syskqfw/aqjy.htm", timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')

            for link in soup.find_all('a'):
                href = link.get('href', '')
                title = link.text.strip()

                if href and ('pdf' in href.lower() or 'doc' in href.lower()):
                    full_url = urljoin(base_url, href)
                    results.append({
                        'title': title,
                        'url': full_url,
                        'source': '北京大学实验室与设备管理部',
                        'type': 'handbook',
                        'category': '安全教育资料'
                    })
        except Exception as e:
            logger.error(f"Failed to scrape PKU: {e}")

        output_file = self.output_dir / "pku_resources.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        logger.info(f"PKU: Found {len(results)} resources")
        return results

    def scrape_zju(self):
        """爬取浙江大学实验室安全资源"""
        logger.info("Scraping Zhejiang University...")

        base_url = "https://lesc.zju.edu.cn"
        results = []

        # 爬取事故案例库
        try:
            response = self.session.get(f"{base_url}/sgal/list.htm", timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')

            for item in soup.find_all('li'):
                link = item.find('a')
                if link:
                    title = link.text.strip()
                    href = link.get('href', '')

                    if href:
                        full_url = urljoin(base_url, href)
                        results.append({
                            'title': title,
                            'url': full_url,
                            'source': '浙江大学实验室安全管理中心',
                            'type': 'case_study',
                            'category': '事故案例'
                        })
        except Exception as e:
            logger.error(f"Failed to scrape ZJU: {e}")

        output_file = self.output_dir / "zju_resources.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        logger.info(f"ZJU: Found {len(results)} resources")
        return results

    def scrape_mem_accidents(self):
        """爬取应急管理部事故通报"""
        logger.info("Scraping Ministry of Emergency Management...")

        base_url = "https://www.mem.gov.cn"
        results = []

        try:
            # 事故通报列表页
            response = self.session.get(f"{base_url}/xw/yjglbgzdt/", timeout=10)
            response.encoding = 'utf-8'
            soup = BeautifulSoup(response.text, 'html.parser')

            for item in soup.find_all('li'):
                link = item.find('a')
                date_span = item.find('span', class_='date')

                if link:
                    title = link.text.strip()
                    href = link.get('href', '')
                    date = date_span.text if date_span else ''

                    # 只采集实验室相关事故
                    if any(kw in title for kw in ["实验室", "高校", "学校", "研究院"]):
                        full_url = urljoin(base_url, href)
                        results.append({
                            'title': title,
                            'date': date,
                            'url': full_url,
                            'source': '应急管理部',
                            'type': 'accident_report',
                            'category': '事故通报'
                        })
        except Exception as e:
            logger.error(f"Failed to scrape MEM: {e}")

        output_file = self.output_dir / "mem_accidents.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        logger.info(f"MEM: Found {len(results)} accident reports")
        return results

    def scrape_all(self):
        """爬取所有来源"""
        all_results = {
            'tsinghua': self.scrape_tsinghua(),
            'pku': self.scrape_pku(),
            'zju': self.scrape_zju(),
            'mem': self.scrape_mem_accidents()
        }

        # 汇总统计
        total = sum(len(results) for results in all_results.values())
        logger.info(f"\n=== 采集完成 ===")
        logger.info(f"总计: {total} 条资源")
        for source, results in all_results.items():
            logger.info(f"  {source}: {len(results)} 条")

        # 保存汇总
        summary_file = self.output_dir / "summary.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2)

        return all_results


# ========== 使用示例 ==========

if __name__ == "__main__":
    scraper = ChineseUniversityScraper()

    # 爬取所有来源
    results = scraper.scrape_all()

    print("\n采集的资源已保存到: data_sources/chinese_universities/")
    print("下一步: 下载PDF并提取文本内容")
