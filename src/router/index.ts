import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { 
          title: '仪表板', 
          icon: 'Odometer',
          description: '系统状态监控与数据总览'
        }
      },

      {
        path: 'unified-data',
        name: 'UnifiedDataManagement',
        component: () => import('@/views/UnifiedDataManagementView.vue'),
        meta: { 
          title: '统一数据管理', 
          icon: 'DataAnalysis',
          description: '使用统一服务的数据管理'
        }
      },
      {
        path: 'screening',
        name: 'StockScreening',
        component: () => import('@/views/StockScreeningView.vue'),
        meta: { 
          title: '股票筛选', 
          icon: 'Filter',
          description: '技术面、基本面、综合筛选'
        }
      },

      {
        path: 'candidate',
        name: 'CandidateSelection',
        component: () => import('@/views/CandidateSelectionView.vue'),
        meta: { 
          title: '海选中心', 
          icon: 'Select',
          description: '完整的海选流程，从筛选到AI分析'
        }
      },
      {
        path: 'recommendation',
        name: 'SmartRecommendation',
        component: () => import('@/views/SmartRecommendationView.vue'),
        meta: { 
          title: '智能推荐', 
          icon: 'Star',
          description: '智能推荐和买入卖出点位分析'
        }
      },
      {
        path: 'ai-analysis',
        name: 'UnifiedAIAnalysis',
        component: () => import('@/views/UnifiedAIAnalysisView.vue'),
        meta: { 
          title: 'AI分析', 
          icon: 'Cpu',
          description: '使用统一服务的AI分析'
        }
      },
      
      {
        path: 'news',
        name: 'NewsCenter',
        component: () => import('@/views/NewsCenterView.vue'),
        meta: { 
          title: '新闻中心', 
          icon: 'Document',
          description: '多源新闻获取和情感分析'
        }
      },
      {
        path: 'backtest',
        name: 'BacktestCenter',
        component: () => import('@/views/BacktestCenterView.vue'),
        meta: { 
          title: '回测中心', 
          icon: 'TrendCharts',
          description: '策略回测与性能分析'
        }
      },
      {
        path: 'websocket-monitor',
        name: 'WebSocketMonitor',
        component: () => import('@/views/WebSocketMonitorView.vue'),
        meta: { 
          title: 'WebSocket监控', 
          icon: 'Connection',
          description: 'WebSocket连接状态监控与测试'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 
