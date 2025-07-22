# Stock Scan Frontend

> 现代化股票推荐与回测系统前端应用

基于 Vue 3 + TypeScript + Vite 构建的现代化股票分析前端应用，提供策略回测、实时行情、AI分析等功能的可视化界面，具备完整的WebSocket自动重连机制和实时状态监控。

## 🚀 最新更新 (v2.0)

### 🔄 重构版任务调度器界面
- **组件化设计**: 将大型组件拆分为多个小组件，提高代码可维护性
- **实时进度监控**: 智能数据更新和股票列表更新的实时进度显示
- **状态同步优化**: 页面刷新后自动恢复任务状态和WebSocket连接
- **按钮状态管理**: 任务运行期间自动禁用相关按钮，防止重复操作

### 📡 增强的WebSocket连接管理
- **自动重连机制**: 指数退避算法的智能重连策略
- **连接状态监控**: 实时监控所有WebSocket连接状态
- **页面可见性检测**: 页面切换时自动检查连接状态
- **定期连接检查**: 每30秒自动检查连接状态，确保连接稳定

### 🎯 智能数据更新界面
- **实时进度条**: 显示扫描进度和更新进度的详细进度条
- **阶段指示器**: 清晰显示当前处于扫描阶段还是更新阶段
- **详细状态信息**: 显示当前处理的股票、缺失日期数量等详细信息
- **时间格式化**: 统一的时间显示格式 `yyyy-mm-dd HH:MM:SS`

![image](https://github.com/user-attachments/assets/8b89ddff-295e-4fbd-bde1-b5750b4489a4)
![image](https://github.com/user-attachments/assets/df33ba6b-f4d7-4098-a8d2-562ebf9144e1)
![image](https://github.com/user-attachments/assets/b6b04fa5-6f67-4e44-826e-8c8becf4bc6a)
![image](https://github.com/user-attachments/assets/33b9f679-bd40-474e-8d4e-d87149dcdb7a)
![image](https://github.com/user-attachments/assets/3ead7cac-52c6-4b54-894a-cdf12cf77d56)

## ✨ 功能特性

### 🎯 核心功能
- **策略回测**: 提供直观的策略配置界面，支持多种回测参数设定，并可视化展示回测结果（如胜率、年化收益、最大回撤等），帮助用户评估策略表现。
- **Top策略推荐**: 展示AI推荐的潜力股票，支持按策略筛选、交易次数过滤、多种排序方式，提供详细的回测指标和AI分析结果。
- **实时任务监控**: 通过WebSocket实时监控后端任务执行状态，包括数据采集、策略回测等任务的进度和结果。
- **AI智能分析**: 集成DeepSeek大语言模型，提供智能股票分析和推荐服务，支持实时AI分析结果展示。

### 🔄 实时通信与状态监控
- **WebSocket自动重连**: 完整的WebSocket连接管理，支持自动重连（指数退避算法）、连接状态监控、错误处理。
- **页面级连接管理**: 根据页面路径自动建立相应的WebSocket连接，页面进入时自动测试连接状态。
- **全局连接监控**: 应用启动时自动建立必要的WebSocket连接，定期检查连接状态并自动重连。
- **详细状态显示**: 导航栏和侧边栏显示详细的WebSocket连接状态，支持hover查看具体连接信息。
- **任务状态同步**: 页面刷新后自动恢复任务状态和WebSocket连接。
- **定期连接检查**: 每30秒自动检查连接状态，确保连接稳定。

### 📊 数据可视化
- **专业K线图表**: 采用LightweightCharts库构建专业级金融图表，确保数据展示的清晰度与专业性。
- **实时数据推送**: 通过WebSocket技术实现股票价格和任务状态的实时推送。
- **响应式设计**: 采用响应式设计原则，确保应用在不同尺寸的设备上均能提供良好的用户体验。

### 🎨 用户界面
- **现代化UI**: 基于Element Plus组件库，打造响应式、美观且用户友好的界面设计。
- **深色主题**: 使用Element Plus官方暗黑主题，提供舒适的视觉体验。
- **交互优化**: 支持多种视图模式切换、搜索过滤、排序等功能。
- **组件化设计**: 将大型组件拆分为多个小组件，提高代码可维护性。
- **状态管理**: 智能的按钮状态管理，任务运行期间自动禁用相关按钮。

### 🎯 任务调度器界面
- **实时进度监控**: 智能数据更新和股票列表更新的实时进度显示。
- **调度器状态**: 显示调度器运行状态、任务数量、当前时间等信息。
- **任务管理**: 支持查看定时任务列表、修改任务配置、重置任务等操作。
- **手动触发**: 支持手动触发智能数据更新和股票列表更新任务。

## 🛠️ 技术栈

### 前端核心
- **Vue 3**: 渐进式JavaScript框架，使用组合式API构建高性能用户界面
- **TypeScript**: JavaScript的超集，提供静态类型检查，增强代码健壮性与可维护性
- **Vite**: 极速前端构建工具，提供闪电般的开发体验和优化的生产构建

### UI/样式
- **Element Plus**: 企业级Vue 3 UI组件库，提供丰富、高质量的界面组件
- **Element Plus Icons**: Element Plus官方图标库，提供常用图标
- **SCSS**: 强大的CSS预处理器，提供变量、混入等高级功能

### 数据可视化
- **LightweightCharts**: 轻量级、高性能的金融图表库，专注于K线图和技术指标展示

### 状态管理与路由
- **Pinia**: Vue 3官方推荐的状态管理库，轻量、直观且类型安全
- **Vue Router**: Vue.js官方路由管理器，用于实现单页面应用的导航

### 网络通信
- **Axios**: 基于Promise的HTTP客户端，用于发送后端API请求
- **Socket.IO Client**: 用于实现客户端与服务器之间的实时双向通信（WebSocket）

### WebSocket管理
- **自定义WebSocket管理器**: 完整的WebSocket连接管理解决方案
- **自动重连机制**: 指数退避算法的智能重连策略
- **连接状态监控**: 实时监控所有WebSocket连接状态
- **页面级连接管理**: 根据页面需求自动管理WebSocket连接

### 开发工具
- **Vue TSC**: Vue模板的TypeScript编译器
- **PostCSS**: 用JavaScript转换CSS的工具
- **Autoprefixer**: PostCSS插件，自动添加浏览器厂商前缀

## 📁 项目结构

```
stock-backtest-frontend/
├── public/                 # 静态资源
├── src/
│   ├── assets/             # 静态资源文件 (图片、字体、全局样式等)
│   ├── components/         # 可复用的Vue组件
│   │   ├── common/                 # 通用组件
│   │   │   ├── ProgressCard.vue    # 进度卡片组件
│   │   │   ├── StockSearch.vue     # 股票搜索组件
│   │   │   └── StockSelector.vue   # 股票选择器组件
│   │   ├── scheduler/              # 调度器相关组件
│   │   │   ├── SchedulerStatus.vue # 调度器状态组件
│   │   │   ├── QuickActions.vue    # 快速操作组件
│   │   │   ├── TaskStatus.vue      # 任务状态组件
│   │   │   ├── JobList.vue         # 任务列表组件
│   │   │   └── ControlPanel.vue    # 控制面板组件
│   │   ├── news-analysis/          # 新闻分析组件
│   │   │   ├── NewsAnalysisConfig.vue      # 新闻分析配置
│   │   │   ├── NewsAnalysisControlPanel.vue # 新闻分析控制面板
│   │   │   ├── NewsAnalysisHeader.vue      # 新闻分析头部
│   │   │   ├── NewsAnalysisLayout.vue      # 新闻分析布局
│   │   │   ├── NewsAnalysisResultPanel.vue # 新闻分析结果面板
│   │   │   ├── NewsList.vue                # 新闻列表
│   │   │   └── SentimentSummary.vue        # 情感摘要
│   │   ├── top-backtest/           # Top回测组件
│   │   │   ├── TopBacktestHeader.vue       # Top回测头部
│   │   │   ├── TopBacktestProgress.vue     # Top回测进度
│   │   │   ├── TopBacktestStats.vue        # Top回测统计
│   │   │   └── TopBacktestTable.vue        # Top回测表格
│   │   └── TopStrategyChart.vue    # Top策略图表组件
│   ├── layout/             # 页面布局组件
│   │   ├── components/
│   │   │   ├── NavBar.vue           # 导航栏组件（含WebSocket状态显示）
│   │   │   └── SideBar.vue          # 侧边栏组件（含WebSocket状态显示）
│   │   └── Layout.vue               # 主布局组件
│   ├── router/             # Vue Router路由配置
│   │   └── index.ts
│   ├── store/              # Pinia状态管理
│   │   └── scheduler.ts             # 调度器状态管理（含WebSocket连接）
│   ├── utils/              # 工具函数和WebSocket管理
│   │   ├── api.ts                   # API服务封装
│   │   ├── connectionStatus.ts      # 连接状态管理
│   │   ├── format.ts                # 格式化工具
│   │   ├── request.ts               # 请求工具
│   │   ├── websocketManager.ts      # WebSocket管理器核心
│   │   ├── globalWebSocketManager.ts # 全局WebSocket管理
│   │   └── pageWebSocketManager.ts  # 页面级WebSocket管理
│   ├── views/              # 页面级组件
│   │   ├── DashboardView.vue        # 仪表板视图
│   │   ├── TopBacktestView.vue      # Top策略回测视图
│   │   ├── BacktestView.vue         # 策略回测视图（含AI分析）
│   │   ├── BacktestHistoryView.vue  # 回测历史视图
│   │   ├── NewsAnalysisView.vue     # 新闻分析视图
│   │   ├── NotFoundView.vue         # 404页面
│   │   └── scheduler/               # 调度器相关页面
│   │       └── Scheduler.vue        # 任务调度器页面
│   │   ├── WebSocketTestView.vue    # WebSocket测试页面
│   │   └── scheduler/
│   │       └── Scheduler.vue        # 任务调度视图
│   ├── App.vue             # 应用根组件
│   ├── main.ts             # 应用入口文件
│   └── vite-env.d.ts       # Vite类型声明
├── index.html              # 应用入口HTML文件
├── package.json            # 项目依赖配置
├── vite.config.ts          # Vite构建配置
├── tailwind.config.js      # TailwindCSS配置
├── postcss.config.js       # PostCSS配置
└── tsconfig.json           # TypeScript配置
```

## 🚀 快速开始

### 环境要求
- **Node.js**: `16.0+` 版本
- **pnpm**: `7.0+` 版本 (推荐使用，也可使用npm `8.0+`)

### 安装依赖
```bash
# 使用pnpm (推荐)
pnpm install

# 或使用npm
npm install
```

### 开发模式
```bash
# 启动开发服务器，支持热重载
pnpm dev

# 或
npm run dev
```

应用程序将运行在 `http://localhost:5173`。

### 构建生产版本
```bash
# 执行类型检查并通过Vite构建生产包
pnpm build

# 或
npm run build
```

构建后的文件将输出到 `dist/` 目录。

### 预览生产构建
```bash
# 启动本地静态文件服务器预览生产构建
pnpm preview

# 或
npm run preview
```

## 🔧 开发配置

### API代理配置
在开发环境下，Vite自动将所有 `/api` 开头的请求代理到后端服务：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```

### 环境变量
创建 `.env.local` 文件配置开发环境变量：

```env
# VITE_API_BASE_URL (可选): 如果不使用代理，可直接指定后端API基础地址
# VITE_API_BASE_URL=http://localhost:5000/api

# VITE_WS_URL (必需): WebSocket服务器地址，用于实时数据推送
VITE_WS_URL=ws://localhost:5000
```

### TypeScript配置
```bash
# 执行TypeScript类型检查
pnpm type-check

# 或
npm run type-check
```

## 🎯 基本使用示例

### 1. 浏览Top策略回测数据
进入"Top策略回测"页面，您可以：
- 使用搜索框通过股票代码或名称快速查找股票
- 通过"选择策略"下拉菜单筛选特定策略的回测结果
- 调整"最小交易次数"过滤器，关注交易活跃度更高的股票
- 通过"排序方式"和"排序顺序"调整排行榜展示逻辑
- 在"表格视图"和"卡片视图"之间切换
- 点击股票记录查看详细的回测指标和AI分析结果

### 2. 执行回测任务
在"Top策略回测"页面，点击右上角的"执行回测"按钮，系统将启动全面的策略回测任务。任务进度会通过WebSocket实时推送到前端。

### 3. 监控任务状态
- 页面上的"任务监控"区域实时显示后端回测任务的运行状态和进度
- 导航栏和侧边栏显示WebSocket连接状态
- 鼠标悬停在状态指示器上可查看详细的连接信息

### 4. WebSocket连接测试
- 在侧边栏点击"WebSocket测试"菜单项
- 查看所有WebSocket连接的详细状态
- 手动测试连接和重连功能
- 查看连接统计和详细日志

## 🔄 WebSocket功能特性

### 自动重连机制
- **指数退避算法**: 智能重连策略，避免频繁重连
- **配置参数**: 最大重连次数5次，初始延迟1秒，最大延迟5秒
- **状态监控**: 实时监控连接状态，自动处理断开重连

### 页面级连接管理
- **自动连接**: 页面进入时自动建立所需的WebSocket连接
- **自动断开**: 页面离开时自动断开连接，避免资源浪费
- **状态同步**: 连接状态与页面显示实时同步

### 全局连接管理
- **应用启动**: 应用启动时自动建立必要的全局连接
- **定期检查**: 每10秒检查连接状态，自动重连断开的连接
- **状态统计**: 提供连接率统计和详细状态信息

### 连接状态显示
- **导航栏显示**: 右上角显示总体连接状态和统计信息
- **侧边栏显示**: 左下角显示系统状态指示器
- **详细提示**: 鼠标悬停显示具体的WebSocket连接列表和状态
- **便捷导航**: 点击状态提示可跳转到WebSocket测试页面

## 🤝 贡献指南

这是一个个人开发项目，欢迎提出建议和反馈。如果您发现bug或有功能建议，请通过以下方式联系：

- 提交Issue描述问题或建议
-  Fork项目并提交Pull Request


---

## 🔗 相关链接

- [Vue 3 文档](https://vuejs.org/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Element Plus 文档](https://element-plus.org/)
- [TailwindCSS 文档](https://tailwindcss.com/)
- [Vite 文档](https://vitejs.dev/)
- [LightweightCharts 文档](https://tradingview.github.io/lightweight-charts/)
- [Socket.IO 文档](https://socket.io/)

## 💬 技术支持

如有问题或建议，请提交Issue或联系开发者。

---

## 📝 更新历史

### v1.2.0 - WebSocket自动重连机制完整实现 (2025-07-16)

#### 🆕 新增功能
- **通用WebSocket管理器**: 创建了完整的WebSocket连接管理解决方案 (`src/utils/websocketManager.ts`)
  - 自动重连机制，使用指数退避算法
  - 连接状态监控和管理
  - 事件监听器管理
  - 可配置的重连参数（最大重连次数5次，初始延迟1秒，最大延迟5秒）
  - 完整的错误处理

- **全局WebSocket管理器**: 实现应用启动时的全局连接管理 (`src/utils/globalWebSocketManager.ts`)
  - 应用启动时自动建立必要的WebSocket连接
  - 定期检查连接状态（每10秒）
  - 自动重连断开的连接
  - 提供连接状态统计

- **页面级WebSocket管理器**: 根据页面路径自动管理WebSocket连接 (`src/utils/pageWebSocketManager.ts`)
  - 页面进入时自动建立相应的WebSocket连接
  - 页面离开时自动断开连接，避免资源浪费
  - 支持手动重连和状态检查
  - 连接状态与页面显示实时同步

- **WebSocket测试页面**: 创建了完整的测试和监控界面 (`src/views/WebSocketTestView.vue`)
  - 实时监控所有WebSocket连接状态
  - 手动测试每个连接的重连功能
  - 显示连接统计信息（总连接数、已连接数、连接率）
  - 详细的连接日志记录
  - 重连尝试次数统计

#### 🔄 功能优化
- **连接状态显示增强**: 为导航栏和侧边栏添加了详细的连接状态显示
  - 导航栏显示总体连接状态和统计信息
  - 侧边栏显示系统状态指示器
  - 鼠标悬停显示具体的WebSocket连接列表和状态
  - 点击状态提示可跳转到WebSocket测试页面

- **页面集成**: 为所有主要页面添加了自动WebSocket连接管理
  - DashboardView.vue: 自动连接调度器WebSocket
  - TopBacktestView.vue: 自动连接Top回测WebSocket
  - BacktestView.vue: 自动连接AI分析WebSocket
  - Scheduler.vue: 自动连接调度器WebSocket
  - BacktestHistoryView.vue: 自动连接调度器WebSocket
  - TaskStatusMonitor.vue: 自动连接任务监控WebSocket

#### 🛠️ 技术改进
- **重连算法优化**: 实现了智能的指数退避算法
  - 避免频繁重连对服务器造成压力
  - 动态调整重连延迟时间
  - 最大重连次数限制，避免无限重连

- **状态同步机制**: 实现了全局连接状态管理
  - 实时状态更新（每500ms）
  - 状态变化实时反映在界面上
  - 连接统计动态计算

- **错误处理增强**: 完善了连接错误处理机制
  - 连接错误自动重试
  - 重连失败错误提示
  - 网络异常处理
  - 手动断开控制

#### 📊 支持的WebSocket连接
| 连接名称 | 用途 | 连接地址 | 状态 |
|---------|------|----------|------|
| scheduler | 任务调度状态监控 | `http://localhost:5000/scheduler` | ✅ 已实现 |
| task_monitor | 任务状态实时监控 | `http://localhost:5000/scheduler` | ✅ 已实现 |
| top_backtest | Top策略回测功能 | `http://localhost:5000` | ✅ 已实现 |
| ai_analysis | AI智能分析功能 | `http://localhost:5000/ai_analysis` | ✅ 已实现 |

#### 🎯 用户体验提升
- **信息透明度**: 用户可以清楚看到具体连接了哪些WebSocket
- **交互便利性**: Hover查看详情，点击跳转测试页面
- **视觉一致性**: 与整体设计风格保持一致
- **实时更新**: 状态变化实时反映在界面上

#### 🔧 配置参数
- 最大重连次数：5次
- 初始重连延迟：1000ms
- 最大重连延迟：5000ms
- 传输方式：['websocket', 'polling']
- 状态更新频率：500ms
- 全局检查间隔：10秒

#### ✅ 测试验证
- TypeScript类型检查通过
- Vite构建成功
- 所有功能正常工作
- WebSocket管理器创建和配置正常
- 自动重连机制测试通过
- 连接状态监控正常
- 事件监听器管理正常
- 错误处理机制正常

### v1.1.0 - 基础功能实现 (2025-07-01)
- 实现基础的Vue 3 + TypeScript + Vite项目架构
- 集成Element Plus和TailwindCSS UI框架
- 实现基础的股票回测功能
- 集成LightweightCharts图表库
- 实现基础的WebSocket连接

### v1.0.0 - 项目初始化 (2025-06-28)
- 项目初始化和基础架构搭建
- 基础组件和页面结构实现 
