# Stock Scan Frontend

> 股票推荐与回测系统前端应用

基于 Vue 3 + TypeScript + Vite 构建的现代化股票分析前端应用，提供策略回测、实时行情、自选股管理等功能的可视化界面。

## ✨ 功能特性

- 🎯 **策略回测**: 可视化策略回测配置与结果展示
- 📈 **实时行情**: WebSocket 实时股价推送与图表展示
- ⭐ **自选股管理**: 个人股票关注列表管理
- 📊 **数据可视化**: 基于 LightweightCharts 的专业图表
- 🎨 **现代化UI**: Element Plus + TailwindCSS 响应式设计
- 🔄 **实时通信**: Socket.IO 实时数据推送
- 📱 **移动适配**: 响应式设计，支持移动端访问

## 🛠️ 技术栈

### 核心框架
- **Vue 3**: 渐进式 JavaScript 框架
- **TypeScript**: 类型安全的 JavaScript 超集
- **Vite**: 快速的前端构建工具

### UI 组件库
- **Element Plus**: Vue 3 组件库
- **TailwindCSS**: 原子化 CSS 框架
- **Element Plus Icons**: 图标库

### 数据可视化
- **LightweightCharts**: 轻量级金融图表库

### 状态管理 & 路由
- **Pinia**: Vue 3 状态管理库
- **Vue Router**: Vue.js 官方路由

### 网络通信
- **Axios**: HTTP 客户端
- **Socket.IO Client**: WebSocket 实时通信

### 开发工具
- **Vue TSC**: Vue TypeScript 编译器
- **PostCSS**: CSS 后处理器
- **Autoprefixer**: CSS 自动前缀

## 📁 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── assets/            # 资源文件 (图片、字体等)
│   ├── components/        # 可复用组件
│   ├── layout/           # 布局组件
│   ├── router/           # 路由配置
│   ├── store/            # Pinia 状态管理
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   │   ├── DashboardView.vue      # 仪表板
│   │   ├── BacktestView.vue       # 策略回测
│   │   ├── WatchlistView.vue      # 自选股
│   │   └── scheduler/             # 任务调度
│   ├── App.vue           # 根组件
│   ├── main.ts           # 应用入口
│   └── vite-env.d.ts     # Vite 类型声明
├── index.html            # HTML 模板
├── package.json          # 项目配置
├── vite.config.ts        # Vite 配置
├── tailwind.config.js    # TailwindCSS 配置
├── postcss.config.js     # PostCSS 配置
└── tsconfig.json         # TypeScript 配置
```

## 🚀 快速开始

### 环境要求

- Node.js 16.0+
- pnpm 7.0+ (推荐) 或 npm 8.0+

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev

# 或
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用

### 构建生产版本

```bash
# 类型检查 + 构建
pnpm build

# 或
npm run build
```

### 预览生产构建

```bash
# 预览构建结果
pnpm preview

# 或
npm run preview
```

## 🔧 开发配置

### API 代理配置

开发环境下，前端会自动代理 `/api` 请求到后端服务：

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',  // 后端服务地址
      changeOrigin: true
    }
  }
}
```

### 环境变量

创建 `.env.local` 文件配置开发环境变量：

```env
# API 基础地址 (可选，默认使用代理)
VITE_API_BASE_URL=http://localhost:5000

# WebSocket 地址
VITE_WS_URL=ws://localhost:5000
```

### TypeScript 配置

项目使用严格的 TypeScript 配置，确保类型安全：

```bash
# 类型检查
pnpm type-check

# 或
npm run type-check
```

## 📊 核心功能模块

### 1. 策略回测 (`BacktestView.vue`)

- 策略选择与参数配置
- 股票池选择
- 回测时间区间设置
- 实时回测进度显示
- 回测结果可视化 (收益曲线、交易记录)
- 性能指标计算 (夏普比率、最大回撤等)

### 2. 实时行情 (开发中)

- WebSocket 实时价格推送
- K线图表展示
- 技术指标叠加
- 多股票切换

### 3. 自选股管理 (开发中)

- 股票搜索与添加
- 自选股列表展示
- 实时价格监控
- 自定义分组

### 4. 任务调度 (`scheduler/Scheduler.vue`)

- 数据采集任务管理
- 任务状态监控
- 调度配置

## 🎨 UI 设计规范

### 色彩方案

- 主色调: Element Plus 默认蓝色
- 背景: 深色主题 (gray-800, gray-900)
- 文字: 白色/灰色层次
- 成功/上涨: 红色 (text-red-500)
- 失败/下跌: 绿色 (text-green-500)

### 组件使用

```vue
<!-- 使用 Element Plus 组件 -->
<el-button type="primary" @click="handleClick">
  开始回测
</el-button>

<!-- 结合 TailwindCSS 样式 -->
<div class="p-6 bg-gray-800 rounded-lg">
  <h1 class="text-3xl font-bold text-white mb-6">
    策略回测
  </h1>
</div>
```

## 🔌 API 集成

### HTTP 请求

```typescript
// utils/api.ts 示例
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 获取策略列表
export const getStrategies = () => api.get('/strategies')

// 创建回测任务
export const createBacktest = (data: BacktestConfig) => 
  api.post('/backtests', data)
```

### WebSocket 连接

```typescript
// 实时数据连接示例
import { io } from 'socket.io-client'

const socket = io('ws://localhost:5000')

socket.on('realtime_data', (data) => {
  // 处理实时数据
  console.log('实时数据:', data)
})
```

## 📈 性能优化

### 代码分割

```typescript
// 路由懒加载
const BacktestView = () => import('@/views/BacktestView.vue')
```

### 图表优化

- 使用 LightweightCharts 轻量级图表库
- 数据分页加载
- 图表容器虚拟滚动

## 🧪 开发建议

### 组件开发

1. 使用 `<script setup>` 语法
2. 添加 TypeScript 类型注解
3. 使用 Composition API
4. 遵循 Vue 3 最佳实践

### 样式规范

1. 优先使用 TailwindCSS 原子类
2. 复杂样式使用 `<style scoped>`
3. 响应式设计考虑移动端

### 状态管理

```typescript
// store/backtest.ts 示例
import { defineStore } from 'pinia'

export const useBacktestStore = defineStore('backtest', {
  state: () => ({
    results: [],
    loading: false
  }),
  actions: {
    async runBacktest(config: BacktestConfig) {
      this.loading = true
      // API 调用
    }
  }
})
```

## 🚧 待开发功能

- [ ] 实时行情 WebSocket 集成
- [ ] 自选股完整功能
- [ ] 仪表板数据可视化
- [ ] 移动端优化
- [ ] 国际化支持
- [ ] 主题切换
- [ ] PWA 支持

MIT License

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
