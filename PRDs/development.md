这份技术文档旨在为 Cursor 提供极其明确的实施路径。核心原则是：利用成熟生态，拒绝从零开发，确保隐私本地化。

---

## 项目当前状态

**项目名称**: CET-TransMaster  
**项目类型**: CET 四六级英语翻译练习 Web 应用  
**当前版本**: 0.1.0  
**最后更新**: 2026-04-04

### 已实现功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| 首页 Dashboard | ✅ | 统计卡片 + 历史记录列表 |
| API 设置 | ✅ | 支持 8 种 AI 服务商 |
| 文本准备 | ✅ | 中文原文 + 参考译文输入（整体保存，不拆分） |
| 智能拆分 | ✅ | 按中文标点自动拆分，支持合并/拆分/编辑 |
| 翻译练习 | ✅ | 计时器、逐句输入、Enter 切换 |
| 布局切换 | ✅ | 左右/上下布局切换 |
| 实时保存 | ✅ | 每 5 秒自动保存草稿 |
| AI 分析 | ✅ | 整体对比 + 逐句分析结果 |
| 历史记录 | ✅ | 列表展示 + 详情复盘 |
| 删除历史 | ✅ | 支持删除单条历史记录 |
| 响应式布局 | ✅ | 适配移动端和桌面端 |
| 当前句子高亮 | ✅ | 翻译时原文预览高亮当前句子 |

### 支持的 AI 服务商

| 服务商 | 模型示例 | 说明 |
|--------|----------|------|
| OpenAI | gpt-4o, gpt-4o-mini | 默认 |
| DeepSeek | deepseek-chat | |
| 智谱AI | glm-4 | |
| Google Gemini | gemini-1.5-pro | |
| Minimax | abab6.5s-chat | 需要 GroupId:APIKey 格式 |
| 阿里 Qwen | qwen-turbo | 通义千问 |
| Anthropic | claude-3-5-sonnet | Claude |
| Ollama | llama3.2 | 本地模型 |
| 其它 (自定义) | 自定义 | 支持任意 OpenAI 兼容 API |

---

## 技术架构文档 (TDD)

### 1. 核心技术栈 (Stack Selection)
为了确保不“造轮子”，我们选用社区最成熟的方案：

* 全栈框架: Next.js 14+ (App Router) - 业界标准，集成了路由、API 处理和前端渲染。
* UI 组件库: Shadcn UI + Radix UI - 基于高度成熟的无样式组件，Cursor 只需引用现成组件（Button, Card, Input, Dialog），无需手写 CSS。
* 状态管理: Zustand - 极其简单的状态流转，用于处理计时器状态、API 配置和翻译草稿。
* 本地存储: Browser LocalStorage - 实现完全本地化，无需配置数据库。
* AI 调度: Vercel AI SDK - 关键组件。它统一了不同 AI 供应商（OpenAI, Anthropic, Ollama, DeepSeek）的调用格式，避免为每个模型手写 API 请求逻辑。
* 表单处理: React Hook Form + Zod - 成熟的表单校验方案。

------------------------------
2. 系统架构设计 (System Architecture)2.1 本地化声明

* 无后端需求: 所有的 API 请求由 Next.js 的 Route Handlers 在本地开发环境下转发，或直接从浏览器端发起。
* 隐私安全: API Key 仅存放在用户浏览器本地，不上传至任何服务器。

2.2 核心模块逻辑 (No-Wheel-Reinventing)A. 文本拆分模块 (Text Splitter)

* 方案: 使用正则表达式配合 Intl.Segmenter（原生浏览器支持）。
* Cursor 指令: "使用原生 JavaScript 的 split 正则表达式按 [。！？\n] 拆分字符串，并映射为包含 id, content, status 的对象数组。"

B. 计时器模块 (Timer)

* 方案: 使用自定义 Hook 封装 setInterval。
* 功能: 支持 start, pause, resume, reset。

C. API 通讯层 (Unified AI Interface)

* 方案: 采用 OpenAI 兼容协议。由于 DeepSeek, 智谱 (Zhipu), Minimax 均支持 OpenAI 格式的 API 适配，我们只需编写一套逻辑。
* Cursor 指令: "创建一个通用的 chatCompletion 函数，从 Zustand 获取 baseUrl, apiKey 和 modelName。使用标准 OpenAI SDK 格式发送请求。"

------------------------------
3. 详细组件清单 (Component List)

| 功能模块 | 推荐组件 (Shadcn UI) | 特殊逻辑 |
|---|---|---|
| 导航/进度 | Progress, Badge | 实时反映 currentIndex / total |
| 翻译输入 | react-textarea-autosize | 必须使用此组件实现高度自适应，严禁手写 JS 计算高度 |
| API 配置 | Dialog, Select, Input | 包含“显示/隐藏 Key”的切换逻辑 |
| 计时暂停 | Overlay (自定义) | 叠加 backdrop-blur 滤镜，确保暂停时无法看到原文 |
| 历史记录 | ScrollArea, Card | 渲染 LocalStorage 中的 JSON 数组 |

------------------------------
4. 关键 Prompt 指令集 (给 Cursor 的“咒语”)Step 1: 项目初始化

"创建一个 Next.js 项目，安装 lucide-react, zustand, clsx, tailwind-merge。配置 Shadcn UI，并导入 Button, Card, Textarea, Dialog, Progress 组件。"

Step 2: 状态机构建

"使用 Zustand 创建一个 useTransStore。状态需包含：sentences (原文数组), userTranslations (用户译文数组), timer (秒数), isPaused (布尔值), apiConfig (包含 provider, key, model)。提供 updateTranslation 和 nextSentence 方法。"

Step 3: AI 分析 Prompt (核心逻辑)

"编写一个服务端 Action。System Prompt 为：'你是一位专业的四六级英语老师。请对比用户译文与标准译文。输出 JSON 格式：{ score: 数字, errors: [{ original: 错误处, suggestion: 修改建议, reason: 原因 }], polish: 进阶表达建议 }'。"

------------------------------
