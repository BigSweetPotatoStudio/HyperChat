# HyperChat

> 🌟 **下一代 AI 工作空间** - AI as Code 的开创性实践，配置驱动的智能协作平台

HyperChat 2.0 是一个革命性的多平台 AI 工作空间，首创**「AI as Code」**理念，以**工作区（Workspace）**为核心，**配置文件**为驱动，完整支持 **MCP（模型上下文协议）**生态。让 AI 能力像基础设施一样**可版本控制、可复制、可共享**，打造真正智能的开发和工作环境。

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


## 🎯 项目愿景

**[HyperChat 1.0](./archive/README.1.md)** 是一个完全手工编写的项目，正在迁移到2.0。

**HyperChat 2.0** 大家一起 **Vibe Coding**，欢迎使用 Claude Code 和 GitHub Copilot 等 AI 工具一起开发。下面是项目介绍：

## 🎯 核心理念

### 🗂️ AI as Code：配置驱动的智能革命
HyperChat 2.0 首创**「AI as Code」**理念，将 AI 能力彻底配置化：

- **完全配置化**：所有 AI 能力通过 YAML/JSON 配置文件定义
- **版本控制友好**：AI 配置可以 git 管理，支持分支、合并、回滚
- **团队协作标准化**：共享 Agent 配置，复制最佳实践
- **项目模板化**：不同项目类型有专属的 AI 环境模板
- **声明式管理**：修改配置文件即可改变 AI 行为，无需编程

### 🔌 工作区驱动的智能协作
HyperChat 2.0 以**工作区（Workspace）**为核心，将 AI 能力与您的项目紧密结合：

- **项目工作区**：每个项目都有独立的 `.hyperchat/` 配置目录
- **全局工作区**：系统级配置，可跨项目共享
- **工作区隔离**：Agent、MCP 服务、聊天记录按工作区独立管理
- **无缝切换**：多工作区标签页，一键切换不同项目环境

### 🛠️ MCP 生态深度集成
作为 MCP 协议的完整实现，HyperChat 打造了强大的工具生态：

- **丰富的内置 MCP 服务**：文件系统、终端、设置管理、知识库等
- **动态工具调用**：实时加载和管理 MCP 工具
- **工作区级配置**：每个工作区可配置不同的 MCP 服务
- **调试友好**：可视化工具调用过程，支持参数调试

## ✨ 核心特性

### 🏢 原生级多平台体验 - 相同 API 不同表面
- **真·跨平台一致性**：
  ```typescript
  // 同一份业务逻辑，四种展示方式
  interface ChatSurface {
    executeCommand(cmd: HyperCommand): Promise<HyperResponse>
  }
  ```

- **技术栈清晰分层**：
  | 平台表面 | 主要场景 | 技术特性 | 特有能力 |
  |:---------|:---------|:---------|:---------|
  | **Web 应用** | 快速协作、演示示范 | PWA 可安装、离线缓存 | H5 响应式、地址栏操作 |
  | **Electron 桌面** | 本地开发、深度集成 | 进程隔离架构、原生菜单 | 文件系统直接访问、托盘闪动通知 |
  | **CLI 终端** | CI/CD 集成、批处理 | Node.js 原生执行 | 无头运行模式、标准输出管道 |
  | **VSCode 扩展** | IDE 内开发 | WebView 嵌入 | 访问 VSCode API、工作区感知 |

- **参数级别的跨平台行为一致性**：
  ```yaml
  # .hyperchat/platform.yaml - 统一配置平台差异
  web: {clipboard: "browser-api", notifications: "push"}
  electron: {clipboard: "native-api", notifications: "system"}
  cli: {clipboard: "stdout", notifications: "console"}
  vscode: {clipboard: "workspace-api", notifications: "statusbar"}
  ```

### ⌨️ 强大的 CLI 功能
- **直接 AI 对话**：`hyperchat "你的问题"` - 即时 AI 响应
- **Agent 管理**：创建、列出、删除和与专业化 AI 代理对话
- **工作区集成**：自动工作区检测和管理
- **任务自动化**：使用代理安排和触发自动化任务
- **交互与快速模式**：支持交互式聊天和一次性命令
- **服务管理**：启动 Web 服务器或运行后台服务
- **跨平台**：支持 Windows、macOS 和 Linux

### 🤖 AI 能力矩阵 - 工程级精度实现
- **细粒度模型路由**：根据任务类型、成本、安全性要求自动选择最佳模型
  ```yaml
  routing:
    code_generation: {model: "claude-3-5-sonnet", priority: "quality"}
    code_review: {model: "gpt-4", priority: "consistency"}
    documentation: {model: "qwen-turbo", priority: "cost"}
  ```
- **Agent 生命周期管理**：从创建、进化到退役的完整平台能力
  - **版本化 Prompt**：每个 Agent 可维护多个提示词版本并热切换
  - **能力演进跟踪**：自动记录 Agent 能力的改进历史和效果评估
  - **灰度发布**：新 Agent 配置可按比例逐步推送给用户
- **企业级任务调度**：
  - **DAG 工作流**：支持复杂的任务依赖关系和失败重试
  - **资源感知调度**：根据模型速率限制和成本预算智能调度
  - **审计日志**：完整的操作日志和效果追踪
- **科学对比实验**：
  - **双盲测试**：模型输出隐式标识，消除人工偏见
  - **统计显著性检验**：内置 A/B 测试框架，计算置信区间
  - **成本效益分析**：自动计算每个模型的 ROI 指标

### 📄 配置即完整系统 - IaC 范式在 AI 领域的深度应用
- **类型安全的配置系统**：
  - **JSON Schema 验证**：每个配置文件都有详细的 JSON Schema 保证格式正确
  - **IDE 智能提示**：VSCode 的 YAML 插件自动补全配置字段
  - **配置审计 API**：暴露 `/api/v1/config/validate` 用于 CI/CD 集成
  
- **分层配置架构**：
  ```
  系统全局配置  <-  用户默认配置  <-  项目配置  <-  临时覆盖
  ~/.hyperchat/global/
                 └─ ~/.hyperchat/templates/
                                   └─ ./project/.hyperchat/
                                                     └─ ./local-override/
  ```
  
- **配置变更的战术级控制**：
  - **原子化更新**：配置变更可包裹在事务中，失败自动回滚
  - **健康检查**：配置生效前会执行预定义的验证检查
  - **零停机热重载**：修改配置无需重启服务即可生效
  - **金丝雀发布**：新配置可先对 5% 用户生效观察效果

- **合规性强制注入**：
  - **敏感信息自动脱敏**：配置中的密码、API Key 自动加密存储
  - **权限边界检查**：跨项目访问时强制执行 RBAC 权限控制
  - **操作留痕**：每个配置的读取者、修改者、使用场景均有记录

### 🎨 现代化界面
- **标签页工作区**：直观的多工作区管理
- **智能渲染**：Artifacts、SVG、HTML、Mermaid、数学公式支持
- **暗黑模式**：护眼的深色主题
- **多语言支持**：中英文无缝切换


### 命令行快速启动
```bash
# 全局安装
npm install -g @dadigua/hyperchat

# 或直接运行
npx -y @dadigua/hyperchat
```

#### CLI 使用示例 - 面向管线的编程模式
```bash
# 📊 工作流视角 - 将 CLI 视为 API 的管线

# 🔍 案例：从需求文档到可测试代码的完整工作流
# 1. 创建领域专用工作区 + 智能初始化
hyperchat workspace init --type "django-api" --name "user-service"

# 2. 配置多模型路由策略（质量+成本平衡）
cat > .hyperchat/routing.yaml <<EOF
code_gen: {model: "claude-3-5-sonnet", cost_limit: 0.01}
tests: {model: "gpt-4-turbo", quality_threshold: 0.95}
docs: {model: "qwen-turbo", cost_priority: "high"}
EOF

# 3. 需求分析 -> 技术设计 -> 代码生成 -> 测试验证（管线化）
cat requirement.md | 
  hyperchat exec "analyze-requirements" | 
  hyperchat exec "generate-apidesign" |
  tee api-design.yaml |
  hyperchat exec "implement-from-design" > api.py |
  hyperchat test "generate-unit-tests" > test_api.py

# 4. 评估指标收集自动统计
hyperchat metrics collect                        # API调用统计
hyperchat metrics cost --since yesterday        # 成本分析
hyperchat report generate > quality-report.html  # 质量报告

# 5. 代码审查会话化（保留完整上下文）
hyperchat review session start --target PR#123
hyperchat review comment --line 45 "检查SQL注入风险"
hyperchat review session complete --publish

# 🔧 高级工作流：数据迁移任务的依赖管理
echo '{
  "steps":[
    {"step":"download-dataset","depends":[],"agent":"data-expert"},
    {"step":"validate-schema","depends":["download"],"agent":"analyst"},
    {"step":"transform-data","depends":["validate"],"agent":"engineer"}
  ]
}' | hyperchat dag execute --max-jobs 3 --retry 2

# 🎯 面向 CI 的验证模式
hyperchat validate --config .hyperchat/ci.yaml --format github-actions
```

### Docker 部署
```bash
docker pull dadigua/hyperchat-mini:latest
```

## 🛠️ 技术架构

### 📂 项目结构
```
HyperChat/
├── packages/
│   ├── shared/            # 共享代码和类型定义
│   ├── core/              # Node.js 核心服务 + CLI
│   │   ├── src/workspace/ # 工作区管理系统
│   │   ├── src/mcp/       # MCP 服务实现
│   │   ├── src/cli/       # 命令行界面
│   │   └── src/commands/  # API 命令层
│   ├── web/               # React Web 前端
│   └── electron/          # Electron 桌面应用
└── docs/                  # 完整文档
```

### 🏗️ AI as Code 架构
```
项目目录/
├── .hyperchat/           # AI 能力配置目录（可版本控制）
│   ├── workspace.json    # 工作区配置
│   ├── mcp.json         # MCP 服务配置（Tools as Code）
│   ├── ai_models.json   # AI 模型配置
│   ├── tasks/           # 工作流配置（Workflow as Code）
│   │   ├── daily-report.yaml  # 自动化任务定义
│   │   └── code-review.yaml   # 代码审查流程
│   └── agents/          # AI 智能体配置（AI as Code）
│       ├── frontend-expert/
│       │   ├── agent.yaml      # Agent 能力定义
│       │   ├── memory.md       # 持久化记忆
│       │   └── chatlogs/       # 对话历史
│       ├── backend-optimizer/
│       └── security-scanner/
├── .git/                # 代码版本控制
├── .gitignore
└── README.md

# 全局模板库
~/Documents/HyperChat/
├── .hyperchat/          # 全局配置
└── templates/           # 项目模板
    ├── react-project/   # React 项目 AI 环境
    ├── python-ml/       # Python ML 项目 AI 环境
    └── golang-api/      # Go API 项目 AI 环境
```

### 🔄 配置驱动架构
- **配置解析层**：自动解析 YAML/JSON 配置，实时生效
- **统一命令层**：`packages/core/src/command.mts` 处理前后端通信
- **AI 服务层**：`packages/shared/src/ai.mts` 统一 AI 模型调用
- **工作区管理**：`packages/core/src/workspace/` 提供配置驱动的工作区管理
- **MCP 集成**：`packages/core/src/mcp/` 实现完整的 MCP 协议支持
- **实时通信**：WebSocket 支持实时消息推送和配置热重载

## 🌟 AI as Code 的革命性优势 - 架构级革新

### 🎯 完整的 Git 集成能力 - 真正的 DevOps for AI
```bash
# 不仅仅是版本控制，而是完整的 AI 开发生命周期
# 1. 功能开发：添加新的 AI 能力
hyperchat workspace prime-checker      # 创建专用工作区
git add .hyperchat/agents/prime-checker/agent.yaml
git commit -m "feat: add prime number validation agent for crypto trading"

# 2. A/B 测试：并行部署多个 AI 配置版本
hyperchat workspace test-v2            # 创建测试工作区
git checkout testing .hyperchat/
hyperchat agent run-comparison         # 对比测试结果

# 3. 配置继承：子项目特化父项目 AI 能力
cp ../base-project/.hyperchat ./       # 基础模板继承
echo "custom_prompt: '专注高频交易策略'" >> ./.hyperchat/agents/trader/agent.yaml

# 4. 热修复：临时的 AI 行为补丁
echo "override_context: '今日市场特殊处理'" > ./.hyperchat/today.yaml
hyperchat workspace reload             # 无需重启即时生效

git tag v2.1.0-ai-stable               # 记录稳定 AI 配置版本
```

### 📋 配置即文档
```yaml
# .hyperchat/agents/frontend-expert/agent.yaml
name: "前端架构专家"
description: "专注于 React、TypeScript、性能优化的 AI 助手"
modelKey: "claude-3-5-sonnet"
isConfirmCallTool: false
allowMCPs: ["filesystem", "terminal", "knowledge-base"]
prompt: |
  你是一位资深的前端架构师，专精于：
  1. React 18+ 最佳实践和性能优化
  2. TypeScript 类型系统设计
  3. 现代前端工程化工具链
  4. 响应式设计和移动端适配
  
  工作原则：
  - 优先考虑性能和可维护性
  - 遵循团队编码规范
  - 提供可执行的具体建议
tags: ["frontend", "react", "typescript", "performance"]
```

### 🚀 项目模板标准化
```bash
# 快速初始化 React 项目的 AI 环境
hyperchat workspace create
cp -r ~/.hyperchat/templates/react-enterprise/.hyperchat ./

# 立即获得：
# ✅ 前端开发专家 Agent
# ✅ 代码审查自动化流程
# ✅ 性能监控任务
# ✅ 文档生成工作流
```

## 🎮 功能矩阵

### 🗂️ 工作区功能
- ✅ **多工作区标签页**：一个界面管理多个项目
- ✅ **工作区隔离**：配置、Agent、聊天记录完全隔离
- ✅ **文件树集成**：直接在工作区内浏览和编辑项目文件
- ✅ **工作区历史**：快速访问最近使用的工作区
- ✅ **全局/项目配置**：灵活的配置继承机制

### 🔌 MCP 生态系统
- ✅ **内置 MCP 服务**：
  - 🗃️ **KnowledgeBase**：智能知识库管理
  - 💾 **Settings**：系统设置管理
  - 🖥️ **Terminal**：终端命令执行
  - 🔗 **Gateway**：MCP 服务网关
  - 🛠️ **HyperTools**：超级工具集
- ✅ **动态服务管理**：实时启动/停止 MCP 服务
- ✅ **工具调用可视化**：清晰展示 AI 工具使用过程
- ✅ **参数调试**：支持手动调试 MCP 工具参数


### 🎨 高级特性
- ✅ **HyperPrompt 语法**：支持变量和 JS 代码片段
- ✅ **智能 Agent 系统**：可配置提示词和工具权限
- ✅ **定时任务执行**：自动化工作流支持
- ✅ **多模态渲染**：Artifacts、SVG、HTML、Mermaid、数学公式
- ✅ **模型对比聊天**：并行测试不同模型效果

## 📦 环境要求

确保您的系统已安装：
- Node.js
- uv (推荐用于 Python 环境管理)

### 安装 uv
```bash
# macOS
brew install uv

# Windows
winget install --id=astral-sh.uv -e
```

### 安装 Node.js
```bash
# macOS
brew install node

# Windows
winget install OpenJS.NodeJS.LTS
```

### ⚠️ Windows 重要要求

**Windows 用户必须使用 Node.js 版本 20.19.1**，这是由于原生模块编译要求（特别是 node-pty）。

```bash
# 在 Windows 上安装特定 Node.js 版本
nvm install 20.19.1
nvm use 20.19.1

# 或从 Node.js 官网直接下载
# https://nodejs.org/dist/v20.19.1/
```

#### Windows 原生依赖

HyperChat 依赖 `node-pty` 来实现终端功能，这需要：

1. **Visual Studio Build Tools**：用于 C++ 编译
2. **Python**：用于 node-gyp
3. **Windows SDK**：用于原生模块构建

**安装建议：**
- 阅读官方 [node-pty 安装指南](https://github.com/microsoft/node-pty#dependencies) 了解详细的 Windows 设置
- 建议使用 **Windows Subsystem for Linux (WSL)** 来简化开发环境设置
- 从 [Microsoft Visual Studio](https://visualstudio.microsoft.com/build-tools/) 安装 Visual Studio Build Tools

**如果遇到编译错误：**
```bash
# 安装 windows-build-tools（旧系统可能需要）
npm install --global windows-build-tools

# 或使用 chocolatey
choco install visualstudio2019buildtools
```

详细故障排除请参考：
- [node-pty GitHub 仓库](https://github.com/microsoft/node-pty)
- [Node.js 原生插件文档](https://nodejs.org/api/addons.html)

## 🔧 开发指南

### 💻 本地开发
```bash
# 克隆项目
git clone https://github.com/BigSweetPotatoStudio/HyperChat.git
cd HyperChat

# 安装依赖
npm install
cd packages/electron && npm install
cd packages/web && npm install
cd ../..

# 启动开发服务器
npm run dev
```

### 🌟 AI 协作开发
HyperChat 2.0 本身就是 **AI 协作开发**的最佳实践：

- **HyperChat 1.0** → 传统手工开发模式
- **HyperChat 2.0** → AI 驱动的 Vibe Coding 模式

推荐开发工具链：
- 🤖 **Claude Code** - 智能代码生成和重构
- 🔧 **GitHub Copilot** - 实时代码补全
- 📝 **HyperChat** - 项目上下文的 AI 对话

### 🏗️ AI as Code 开发模式
1. **初始化项目 AI 环境**：`hyperchat workspace create`
2. **选择项目模板**：复制对应技术栈的 AI 配置模板
3. **自定义 Agent 配置**：编辑 YAML 文件定制专属 AI 助手
4. **版本控制 AI 配置**：将 `.hyperchat/` 纳入 Git 管理
5. **团队共享最佳实践**：通过 Git 分享和同步 AI 工作流
6. **持续优化迭代**：像重构代码一样优化 AI 配置

## 🌟 发展路线图

### 🎯 近期目标
- [ ] **AI 配置模板市场**：社区共享的 Agent 和工作流模板
- [ ] **配置智能推荐**：基于项目特征自动推荐 AI 配置
- [ ] **多 Agent 协作编排**：配置化的 Agent 间协作流程
- [ ] **VSCode 深度集成**：IDE 内的 AI as Code 开发体验
- [ ] **配置合规检查**：AI 配置的安全性和合规性验证

### 🚀 长期愿景
- [ ] **AI as Code 标准制定**：推动行业 AI 配置标准化
- [ ] **企业级 AI 治理**：可审计、可合规的 AI 配置管理
- [ ] **AI 能力市场**：标准化的 AI 能力交易和分发平台
- [ ] **智能配置生成**：AI 自动生成和优化 AI 配置
- [ ] **全栈 AI 开发平台**：Infrastructure as Code + AI as Code 的统一平台

## 📸 功能预览

### 🗂️ 工作区标签页管理
- 直观的多工作区切换界面
- 全局工作区与项目工作区并存
- 每个工作区独立的文件树、Agent、MCP 配置

![工作区标签页预览](./images/7f613001-daa3-4f2e-a0b5-c3380bc0a25f.png)

### 🔌 MCP 服务生态
- 内置丰富的 MCP 服务：知识库、终端、设置管理等
- 可视化工具调用过程，支持参数调试
- 工作区级 MCP 配置，灵活的服务组合

### 🤖 智能 Agent 系统
- 工作区专属 Agent 配置
- 支持预设提示词和工具权限管理
- 聊天记录按工作区和 Agent 组织

### 🎨 多模态内容渲染
- **HyperPrompt**：文本 + JS 代码变量支持
- **Artifacts**：交互式代码和界面预览
- **数学公式**：KaTeX 渲染支持
- **图表支持**：Mermaid、SVG、HTML 等

### 📊 模型对比测试
- 并行使用多个 AI 模型
- 实时对比不同模型的回答质量
- 支持工作区级模型配置

## 🤝 社区交流

- [Telegram](https://t.me/dadigua001)
- [QQ 群](https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim)

## 📄 免责声明

本项目仅供学习交流使用。使用本项目进行的任何操作（如爬虫行为等）与项目开发者无关。

## 📜 许可证

本项目采用开源许可证，详情请查看 [LICENSE](LICENSE) 文件。

---

## 🔥 为什么选择 HyperChat 2.0？

### 🎯 传统 AI 工具 vs HyperChat 2.0

| 特性 | 传统 AI 工具 | HyperChat 2.0 |
|------|-------------|---------------|
| **AI 配置方式** | 在线界面设置 | 本地配置文件 (AI as Code) |
| **版本控制** | ❌ 无法版本控制 | ✅ Git 管理，可回滚可分支 |
| **团队协作** | ❌ 难以共享配置 | ✅ 标准化的团队 AI 环境 |
| **项目集成** | ❌ 与项目分离 | ✅ AI 配置随项目走 |
| **透明度** | ❌ AI 行为黑盒 | ✅ 完全透明可控 |
| **可复制性** | ❌ 配置难以复制 | ✅ 一键复制完整 AI 环境 |

### 💡 核心价值主张

1. **让 AI 能力像代码一样管理** - 版本控制、代码审查、CI/CD
2. **团队 AI 标准化** - 新员工秒获团队 AI 最佳实践
3. **项目 AI 一体化** - AI 配置与项目代码同生共存
4. **完全的透明可控** - 每个 AI 行为都有对应配置文件
5. **企业级 AI 治理** - 可审计的 AI 配置变更历史

---

✨ **HyperChat 2.0** - 首创 AI as Code，重新定义 AI 工作方式 ✨

## 🚀 快速体验 1.0

### 在线 Demo 1.0
- [HyperChat](https://hyperchat.dadigua.men/123456/) - Node.js 版本
- [Docker Demo](https://htmivlknrjln.ap-northeast-1.clawcloudrun.com/123456/#/Chat) - ClawCloud 部署