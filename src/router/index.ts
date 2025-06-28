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
          path: 'watchlist',
          name: 'Watchlist',
          component: () => import('@/views/WatchlistView.vue'),
          meta: { title: '自选股' }
        },
        {
          path: 'scheduler',
          name: 'Scheduler',
          component: () => import('@/views/scheduler/Scheduler.vue'),
          meta: { title: '任务调度' }
        }
      ]
    },
    // Add other top-level routes here if needed (e.g., for a login page)
  ]
})

export default router 