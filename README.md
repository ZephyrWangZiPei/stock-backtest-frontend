# Stock Scan Frontend

> 现代化股票推荐与回测系统前端应用

基于 Vue 3 + TypeScript + Vite 构建的现代化股票分析前端应用，提供策略回测、实时行情、Ai分析等功能的可视化界面。
![image](https://github.com/user-attachments/assets/8b89ddff-295e-4fbd-bde1-b5750b4489a4)
![image](https://github.com/user-attachments/assets/df33ba6b-f4d7-4098-a8d2-562ebf9144e1)
![image](https://github.com/user-attachments/assets/b6b04fa5-6f67-4e44-826e-8c8becf4bc6a)
![image](https://github.com/user-attachments/assets/33b9f679-bd40-474e-8d4e-d87149dcdb7a)
![image](https://github.com/user-attachments/assets/3ead7cac-52c6-4b54-894a-cdf12cf77d56)


## ✨ 功能特性

- 🎯 **策略回测**: 提供直观的策略配置界面，支持多种回测参数设定，并可视化展示回测结果（如胜率、年化收益、最大回撤等），帮助用户评估策略表现。
- 📈 **实时行情**: 通过 WebSocket 技术实现股票价格的实时推送，结合专业K线图表，为用户提供准确、及时的市场动态。
- 🧩 **双板块策略推荐**: 针对指数和普通股票提供独立的分栏展示和分页功能，便于用户高效浏览不同板块的策略推荐。
- ⭐ **自选股管理**: 用户可以轻松添加、移除和管理个人关注的股票列表，并实时监控其价格变动，实现个性化的股票追踪。
- 📊 **数据可视化**: 采用 LightweightCharts 库构建专业级金融图表，确保数据展示的清晰度与专业性。
- 🎨 **现代化UI**: 结合 Element Plus 组件库与 TailwindCSS 原子化框架，打造响应式、美观且用户友好的界面设计，适配多种设备。
- 🔄 **实时通信**: 集成 Socket.IO，确保前端与后端之间的数据实时同步，提供流畅的用户体验。
- 📱 **移动适配**: 采用响应式设计原则，确保应用在不同尺寸的移动设备上均能提供良好的用户体验。

## 🛠️ 技术栈

本项目基于以下前沿技术构建：

### 前端核心

-   **Vue 3**: 渐进式 JavaScript 框架，用于构建高性能用户界面。
-   **TypeScript**: JavaScript 的超集，提供静态类型检查，增强代码健壮性与可维护性。
-   **Vite**: 极速前端构建工具，提供闪电般的开发体验和优化的生产构建。

### UI/样式

-   **Element Plus**: 一套企业级 Vue 3 UI 组件库，提供丰富、高质量的界面组件。
-   **TailwindCSS**: 实用至上的 CSS 框架，通过原子化类名快速构建定制化设计。
-   **Element Plus Icons**: Element Plus 官方图标库，提供常用图标。

### 数据可视化

-   **LightweightCharts**: 轻量级、高性能的金融图表库，专注于K线图和技术指标展示。

### 状态管理与路由

-   **Pinia**: Vue 3 官方推荐的状态管理库，轻量、直观且类型安全。
-   **Vue Router**: Vue.js 官方路由管理器，用于实现单页面应用的导航。

### 网络通信

-   **Axios**: 基于 Promise 的 HTTP 客户端，用于发送后端 API 请求。
-   **Socket.IO Client**: 用于实现客户端与服务器之间的实时双向通信（WebSocket）。

### 开发工具

-   **Vue TSC**: Vue 模板的 TypeScript 编译器。
-   **PostCSS**: 一个用 JavaScript 转换 CSS 的工具。
-   **Autoprefixer**: PostCSS 插件，自动添加浏览器厂商前缀。

## 📁 项目结构

```
stock-backtest-frontend/
├── public/                 # 静态资源 (例如 favicon, index.html 引用的公共文件)
├── src/
│   ├── assets/             # 静态资源文件 (图片、字体、全局样式等)
│   ├── components/         # 可复用、通用的 Vue 组件
│   ├── layout/             # 页面布局组件，定义应用整体框架
│   ├── router/             # Vue Router 路由配置文件
│   ├── store/              # Pinia 状态管理模块定义
│   ├── utils/              # 通用工具函数、API 服务封装等
│   ├── views/              # 页面级组件，对应各个主要视图
│   │   ├── DashboardView.vue     # 仪表板/主页视图
│   │   ├── BacktestView.vue      # 策略回测详情视图 (可能存在)
│   │   ├── TopBacktestView.vue   # Top策略回测主页面 (已重构)
│   │   ├── WatchlistView.vue     # 自选股管理视图
│   │   └── scheduler/            # 任务调度相关视图或组件
│   ├── App.vue             # 应用的根组件
│   ├── main.ts             # 应用入口文件，Vue 应用挂载和插件注册
│   └── vite-env.d.ts       # Vite 相关的 TypeScript 类型声明
├── index.html              # 应用的入口 HTML 文件
├── package.json            # 项目依赖、脚本和元数据配置
├── vite.config.ts          # Vite 构建工具配置文件
├── tailwind.config.js      # TailwindCSS 配置文件
├── postcss.config.js       # PostCSS 配置文件
└── tsconfig.json           # TypeScript 编译器配置文件
```

## 🚀 快速开始

### 环境要求

确保您的开发环境满足以下要求：

-   **Node.js**: `16.0+` 版本
-   **pnpm**: `7.0+` 版本 (推荐使用，也可使用 npm `8.0+`)

### 安装依赖

进入项目根目录 (`stock-backtest-frontend`)，使用以下命令安装项目依赖：

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 开发模式

安装依赖后，您可以启动开发服务器：

```bash
# 启动开发服务器，支持热重载
pnpm dev

# 或
npm run dev
```

应用程序将运行在 `http://localhost:5173`。在浏览器中访问此地址即可查看应用。

### 构建生产版本

执行以下命令，将项目构建为用于生产环境的优化版本：

```bash
# 执行类型检查并通过 Vite 构建生产包
pnpm build

# 或
npm run build
```

构建后的文件将输出到 `dist/` 目录。

### 预览生产构建

您可以通过以下命令在本地预览生产构建结果：

```bash
# 启动一个本地静态文件服务器来预览生产构建
pnpm preview

# 或
npm run preview
```

## 🔧 开发配置

### API 代理配置

在开发环境下，Vite 自动将所有 `/api` 开头的请求代理到后端服务，避免跨域问题。此配置位于 `vite.config.ts`：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',  // 后端服务实际地址
      changeOrigin: true
    }
  }
}
```

### 环境变量

您可以通过创建 `.env.local` 文件来配置开发环境下的环境变量。例如：

```env
# VITE_API_BASE_URL (可选): 如果不使用代理，可直接指定后端 API 基础地址
# VITE_API_BASE_URL=http://localhost:5000/api

# VITE_WS_URL (必需): WebSocket 服务器地址，用于实时数据推送
VITE_WS_URL=ws://localhost:5000
```
**注意**: 生产环境下的环境变量配置请参考部署文档。

### TypeScript 配置

本项目采用严格的 TypeScript 配置，以确保代码的类型安全和可维护性。您可以运行类型检查命令：

```bash
# 执行 TypeScript 类型检查
pnpm type-check

# 或
npm run type-check
```

## 🎯 基本使用示例

### 1. 浏览 Top 策略回测数据

进入 "Top策略回测" 页面，您可以：
-   使用顶部的搜索框通过股票代码或名称快速查找感兴趣的股票。
-   通过 "选择策略" 下拉菜单筛选特定策略的回测结果。
-   调整 "最小交易次数" 过滤器，关注交易活跃度更高的股票。
-   通过 "排序方式" 和 "排序顺序" 调整排行榜的展示逻辑。
-   在 "表格视图" 和 "卡片视图" 之间切换，以您偏好的方式浏览数据。
-   点击任一股票记录或卡片，即可弹出 "股票详情" 对话框，查看该股票在特定策略下的详细回测指标和 AI 分析结果。

### 2. 执行回测任务

在 "Top策略回测" 页面，点击右上角的 "执行回测" 按钮，系统将启动一次全面的策略回测任务。任务通常需要一定时间完成，请耐心等待，完成后数据将自动更新。

### 3. 查看任务状态 (任务监控)

您可以在页面上找到 "任务监控" 区域，实时查看后端回测任务的运行状态、进度和历史记录。

### 4. 探索自选股 (待开发)

在 "自选股" 页面，您可以管理个人关注的股票列表。 (此功能仍在开发中，敬请期待)

## 🤝 贡献指南

我们欢迎并感谢对本项目的贡献！如果您有兴趣参与开发，请参考我们的 [贡献指南](CONTRIBUTING.md) 获取详细信息。

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 发布。

---

## 🔗 相关链接

- [Vue 3 文档](https://vuejs.org/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Element Plus 文档](https://element-plus.org/)
- [TailwindCSS 文档](https://tailwindcss.com/)
- [Vite 文档](https://vitejs.dev/)
- [LightweightCharts 文档](https://tradingview.github.io/lightweight-charts/)

## 💬 技术支持

如有问题或建议，请提交 Issue 或联系开发团队。 
