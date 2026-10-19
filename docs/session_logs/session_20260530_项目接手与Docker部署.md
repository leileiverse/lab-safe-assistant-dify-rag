# 会话记录 — 2026年5月30日

> 参与者：新接手开发者 + Claude Code
> 项目：基于 Dify 的实验室安全小助手（lab-safe-assistant-dify-rag）

---

## 一、项目概览了解

### 1.1 项目基本信息

- **项目名称**：基于 Dify 搭建 RAG 增强的大语言模型实验室安全小助手系统
- **定位**：五邑大学大创课题标准版
- **当前完成度**：标准课题版约 97-98%，高目标版约 84-87%
- **核心交付物**：FastAPI 演示应用、3009 条知识库、Dify 工作流集成、安全规则引擎
- **仓库地址**：https://github.com/leilehuimieba/lab-safe-assistant-dify-rag

### 1.2 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | FastAPI 0.115.6 + Uvicorn 0.34.0 |
| 前端 | React SPA（构建产物托管于 web_demo/frontend/dist/） |
| 大模型编排 | Dify（本地 Docker 部署，端口 8080/8081） |
| 备用大模型 | DeepSeek API（Dify 不可用时自动切换） |
| 知识库 | 本地 CSV (3009条) + Dify Dataset 双轨 |
| 数据格式 | CSV、YAML、JSONL |
| 脚本语言 | Python 3.11+、PowerShell |

### 1.3 核心目录结构

```
lab-safe-assistant-dify-rag/
├── web_demo/                    # FastAPI 演示应用（核心工程）
│   ├── app.py                   # 应用入口
│   ├── models.py                # Pydantic 模型
│   ├── repositories.py          # 数据仓库
│   ├── routers/
│   │   ├── chat_routes.py       # /api/chat、/api/search、Dify 代理
│   │   ├── meta_routes.py       # /health、/api/meta
│   │   └── kb_routes.py         # /api/kb/summary、/api/kb/entries
│   ├── services/                # 业务逻辑层
│   └── frontend/                # React SPA 源码 + dist/
├── knowledge_base_curated.csv   # 主知识库（3009 行）
├── safety_rules.yaml            # 安全规则配置
├── libs/                        # 通用工具库
├── scripts/                     # 运维/评测脚本
├── docs/                        # 文档集合
├── release_exports/             # 各版本发布包
├── artifacts/                   # 运行产出
└── dify/                        # Dify Docker 部署配置（本次新增）
```

### 1.4 问答处理流程

```
用户提问 → 本地知识库检索（关键词匹配）
         → 安全规则匹配（safety_rules.yaml）
         → 缓存检查（命中直接返回）
         → Dify 工作流调用（SSE 流式）
         → DeepSeek API 备用（Dify 不可用时）
         → 结构化兜底（两条路都失败时）
         → 低置信度记录（补强队列）
```

---

## 二、前端密码机制分析

### 2.1 认证逻辑（web_demo/services/auth_service.py）

```python
_DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "").strip()

def verify_password(request: Request) -> None:
    if not _DEMO_PASSWORD:       # 未设置密码 → 跳过验证
        return
    provided = request.headers.get("x-password", "")
    if provided != _DEMO_PASSWORD:
        raise HTTPException(status_code=401)
```

### 2.2 结论

- 环境变量 `DEMO_PASSWORD` 未设置 → 密码验证被跳过
- `.env.web_demo` 文件不存在 → 需要手动创建
- 前端登录页存在但随便输入什么都能通过

### 2.3 如何设置密码

创建 `.env.web_demo` 文件：
```env
DEMO_PASSWORD=你的密码
```

---

## 三、项目最终目标全景

### 3.1 核心建设目标（4项）

1. ≥3000 条结构化知识库 ✅ 已达成（3009条）
2. LLM + RAG 问答链路 ✅ 已达成
3. 符合用户习惯的交互界面 ⚠️ 知识库可视化待完善
4. 量化评估体系 ✅ 已达成

### 3.2 最终高目标（5项）

| 指标 | 目标 | 当前状态 |
|------|------|----------|
| 有效回答率 | >95% | 100% ✅ |
| 专业准确率 | >99% | 82% ❌ 差 17% |
| 平均响应 | <3s | 受控回归 ~90ms，Dify 链路波动大 |
| 7×24 服务 | 持续可用 | 骨架已建立，缺连续运行证据 |
| 3 个月试运行 | ≥3个月 | 刚开始累计（W21 首份周报） |

### 3.3 预期交付物（11项）

1. 实验室安全知识库数据包 ✅
2. 可导入 Dify 的知识库 CSV ✅
3. 基于 Dify 的 RAG 问答应用 ✅
4. 本地 FastAPI 演示系统 ✅（端口 8088）
5. 安全规则库 ✅
6. 低置信问题补强队列 ✅
7. Dify 知识库导入报告 ✅
8. 问答测试与评估报告 ✅
9. 部署与运行说明 ✅
10. 用户使用说明 ✅
11. 课题总结报告 ⚠️ 待补写

---

## 四、知识库可视化功能分析

### 4.1 后端 API — 已完成

| 接口 | 功能 | 状态 |
|------|------|------|
| GET /api/kb/summary | 分类/子分类/调用次数/覆盖率统计 | ✅ |
| GET /api/kb/entries | 按分类过滤、分页、条目详情 | ✅ |
| KB 调用追踪 | 记录被问答调用的条目 | ✅ |

### 4.2 前端 — 主体已完成但有缺失

KBVisualization.tsx (437行) 实现了三层下钻：
- L1: ECharts 气泡散点图（分类全景）
- L2: ECharts 旭日图（子分类分布）
- L3: react-window 虚拟列表（条目明细）
- 右侧抽屉：条目详情

### 4.3 学长说"没搞好"的原因

1. **缺少图例（Legend）**：用户看不懂气泡颜色/大小含义
2. **缺少开关控件**：无法切换"已调用/未调用"视图
3. **布局与设计稿不一致**：原始设计需要左侧统计面板（280px），实际是横向卡片
4. **首次调用率为 0%**：3009 条中仅 29 条被调用过，几乎所有气泡都是红色
5. **HANDOVER 中提到的 /kb-viz.html 不存在**：实际路径是 /#/kb (HashRouter)

---

## 五、服务启动验证

### 5.1 服务状态（2026-05-30 检查）

| 检查项 | 地址 | 状态 |
|--------|------|------|
| 健康检查 | http://127.0.0.1:8088/health | 🟢 kb_loaded=3009 |
| 前端页面 | http://127.0.0.1:8088/ | 🟢 React SPA |
| 系统元信息 | http://127.0.0.1:8088/api/meta | 🟢 正常 |
| 知识库检索 | GET /api/search?q=... | 🟢 5条命中 |
| 问答接口 | POST /api/chat | 🟢 走 DeepSeek 备用链路 |
| KB 态势 | http://127.0.0.1:8088/api/kb/summary | 🟢 58个分类 |
| Dify Docker | — | 🔴 未运行 |
| DeepSeek API | — | 🟢 已配置 |

### 5.2 当前问答链路

```
用户提问 → FastAPI 本地检索 → DeepSeek API（Dify 不可用时的备用链路）
```

响应时间约 8-10 秒（走远程 API 较慢），需要恢复 Dify 本地服务达到秒级响应。

---

## 六、Docker 与 Dify 部署

### 6.1 环境检查

- 系统：Windows 11 Home China (Build 26200)
- 架构：64 位，24GB RAM
- WSL：未安装
- Docker：未安装
- Hyper-V：不可用（Home 版不支持）

### 6.2 安装过程

1. **WSL2 安装**：
   - 执行 `wsl --install --no-distribution`
   - 安装成功：WSL 版本 2.7.3.0，内核 6.6.114.1-1

2. **Docker Desktop 安装**：
   - 通过 winget 安装 Docker.DockerDesktop
   - 安装成功：Docker Desktop v29.4.3
   - CLI 路径：C:\Program Files\Docker\Docker\resources\bin\docker.exe

3. **Virtual Machine Platform 启用**：
   - 执行 `Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform`
   - 需要重启生效

4. **Dify 部署配置文件已创建**：
   - `dify/docker-compose.yml`：PostgreSQL + Redis + Weaviate + Dify API + Worker + Web + Nginx
   - `dify/.env`：数据库密码、密钥、管理员密码
   - `dify/nginx.conf`：反向代理配置（8080 Service API, 8081 Console）
   - `dify/setup_dify.ps1`：一键部署脚本

### 6.3 当前阻塞

- Virtual Machine Platform 刚启用，**需要重启电脑**才能生效
- 重启后 Docker Desktop 应能自动创建 WSL2 后端 VM 并启动 Docker Engine

### 6.4 重启后的操作步骤

```powershell
# 1. 确认 Docker 引擎就绪
docker ps

# 2. 进入 Dify 部署目录
cd d:\lab_safe_project\lab-safe-assistant-dify-rag\dify

# 3. 启动 Dify 服务
docker compose up -d

# 4. 等待初始化（约 30 秒）
# 5. 访问 Dify 管理控制台：http://localhost:8081
#    初始密码：admin123456

# 6. 创建 Dify 应用并获取 API Key
# 7. 更新 .env.dify_rag 中的 DIFY_APP_API_KEY
# 8. 重启 FastAPI 服务
```

### 6.5 Dify 服务端口规划

| 端口 | 服务 |
|------|------|
| 8080 | Dify Service API（程序调用） |
| 8081 | Dify Console Web（管理界面） |
| 8082 | Weaviate 向量数据库 |
| 5432 | PostgreSQL |
| 6379 | Redis |

---

## 七、你接手后待办事项总览

| 优先级 | 任务 | 类型 |
|--------|------|------|
| P0 | 重启电脑，确认 Docker Engine 正常 | 环境 |
| P0 | 启动 Dify 服务（docker compose up -d） | 部署 |
| P0 | 配置 Dify 应用 + 导入 3009 条知识库 | 配置 |
| P0 | 更新 .env.dify_rag 连接 Dify | 配置 |
| P0 | 补齐知识库可视化前端（图例+开关+侧边栏） | 功能 |
| P1 | 每周执行日检+周报+准确率复跑 | 运营 |
| P1 | 继续扩评准确率证据（目标 100+ 样本） | 证据 |
| P2 | 补齐 answer 和 source_title 字段缺口 | 数据 |
| P2 | 性能优化（让 Dify 链路稳定 <3s） | 性能 |
| P3 | 累计 3 个月试运行记录 | 时间跨度 |
| P3 | 写课题总结报告 | 文档 |

---

## 八、关键文件索引

| 用途 | 路径 |
|------|------|
| 项目交接文档 | HANDOVER.md |
| 项目完成度与收口计划 | docs/proposal/项目完成度与收口计划_20260522.md |
| 验收自查报告 | docs/proposal/验收自查报告_20260522.md |
| 高目标达成说明 | docs/proposal/原始申报书高目标达成说明_20260522.md |
| 申报书正文 | docs/proposal/申报书_标准课题版_内容稿.md |
| 知识库可视化设计 | docs/design/kb-viz.md |
| 长期运行监测方案 | docs/ops/原申报书长期运行与性能监测方案_20260522.md |
| Dify 恢复与闭环证据 | docs/eval/dify_recovery_and_3009_closure_20260522.md |
| Dify docker-compose | dify/docker-compose.yml |
| Dify 部署脚本 | dify/setup_dify.ps1 |
| FastAPI 入口 | web_demo/app.py |
| 问答路由 | web_demo/routers/chat_routes.py |
| KB 可视化路由 | web_demo/routers/kb_routes.py |
| KB 可视化前端 | web_demo/frontend/src/pages/KBVisualization.tsx |
| 认证服务 | web_demo/services/auth_service.py |
