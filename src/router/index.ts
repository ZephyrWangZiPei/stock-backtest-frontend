import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '仪表盘' }
        },
        {
          path: 'backtest',
          name: 'Backtest',
          component: () => import('@/views/BacktestView.vue'),
          meta: { title: '策略回测' }
        },
        {
          path: 'scheduler',
          name: 'Scheduler',
          component: () => import('@/views/scheduler/Scheduler.vue'),
          meta: { title: '任务调度' }
        },
        {
          path: 'top-backtest',
          name: 'TopBacktest',
          component: () => import('@/views/TopBacktestView.vue'),
          meta: { title: 'Top 回测' }
        },
        {
          path: 'backtest-history',
          name: 'BacktestHistory',
          component: () => import('@/views/BacktestHistoryView.vue'),
          meta: { title: '回测历史' }
        },
        {
          path: 'websocket-test',
          name: 'WebSocketTest',
          component: () => import('@/views/WebSocketTestView.vue'),
          meta: { title: 'WebSocket测试' }
        }
      ]
    },
    // Add other top-level routes here if needed (e.g., for a login page)
  ]
})

export default router 