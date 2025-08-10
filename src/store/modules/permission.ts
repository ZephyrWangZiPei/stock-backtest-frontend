import { defineStore } from 'pinia'
import { RouteRecordRaw } from 'vue-router'

// 中文菜单配置
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../../layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../../views/DashboardView.vue'),
        meta: { title: '数据总览', icon: 'dashboard', affix: true }
      }
    ]
  },
  {
    path: '/data-management',
    component: () => import('../../layout/index.vue'),
    name: 'DataManagement',
    meta: { title: '数据管理', icon: 'table' },
    children: [
      {
        path: 'collection',
        name: 'DataCollection',
        component: () => import('../../views/UnifiedDataManagementView.vue'),
        meta: { title: '数据采集', icon: 'tree' }
      },
      {
        path: 'monitoring',
        name: 'DataMonitoring',
        component: () => import('../../views/WebSocketMonitorView.vue'),
        meta: { title: '数据监控', icon: 'eye-open' }
      },
      {
        path: 'websocket-panel',
        name: 'WebSocketPanel',
        component: () => import('../../components/websocket/EnhancedWebSocketPanel.vue'),
        meta: { title: 'WebSocket管理', icon: 'connection' }
      }
    ]
  },
  {
    path: '/stock-analysis',
    component: () => import('../../layout/index.vue'),
    name: 'StockAnalysis',
    meta: { title: '股票分析', icon: 'chart' },
    children: [
      {
        path: 'screening',
        name: 'StockScreening',
        component: () => import('../../views/StockScreeningView.vue'),
        meta: { title: '股票筛选', icon: 'search' }
      },
      {
        path: 'candidate',
        name: 'CandidateSelection',
        component: () => import('../../views/CandidateSelectionView.vue'),
        meta: { title: '候选池', icon: 'star' }
      },
      {
        path: 'recommendation',
        name: 'SmartRecommendation',
        component: () => import('../../views/SmartRecommendationView.vue'),
        meta: { title: '智能推荐', icon: 'skill' }
      }
    ]
  },
  {
    path: '/backtest',
    component: () => import('../../layout/index.vue'),
    name: 'Backtest',
    meta: { title: '回测中心', icon: 'money' },
    children: [
      {
        path: 'center',
        name: 'BacktestCenter',
        component: () => import('../../views/BacktestCenterView.vue'),
        meta: { title: '策略回测', icon: 'guide' }
      }
    ]
  },
  {
    path: '/news-analysis',
    component: () => import('../../layout/index.vue'),
    name: 'NewsAnalysis',
    meta: { title: '新闻分析', icon: 'message' },
    children: [
      {
        path: 'center',
        name: 'NewsCenter',
        component: () => import('../../views/NewsCenterView.vue'),
        meta: { title: '新闻中心', icon: 'documentation' }
      },
      {
        path: 'sentiment',
        name: 'NewsSentiment',
        component: () => import('../../views/NewsAnalysisView.vue'),
        meta: { title: '情感分析', icon: 'education' }
      }
    ]
  },
  {
    path: '/ai-analysis',
    component: () => import('../../layout/index.vue'),
    name: 'AIAnalysis',
    meta: { title: 'AI分析', icon: 'example' },
    children: [
      {
        path: 'unified',
        name: 'UnifiedAIAnalysis',
        component: () => import('../../views/UnifiedAIAnalysisView.vue'),
        meta: { title: '统一AI分析', icon: 'nested' }
      }
    ]
  }
]

interface PermissionState {
  routes: RouteRecordRaw[]
  addRoutes: RouteRecordRaw[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    routes: [],
    addRoutes: []
  }),

  actions: {
    generateRoutes() {
      this.addRoutes = constantRoutes
      this.routes = constantRoutes
      return constantRoutes
    }
  }
}) 