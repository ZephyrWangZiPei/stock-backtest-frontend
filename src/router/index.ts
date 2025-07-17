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
    // 404 页面
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '页面不存在' }
    }
  ]
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} - Stock Scan`
  } else {
    document.title = 'Stock Scan'
  }

  // 这里可以添加权限检查逻辑
  // if (to.meta?.requiresAuth && !isAuthenticated()) {
  //   next('/login')
  //   return
  // }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 页面切换后的处理
  console.log(`Navigated from ${from.path} to ${to.path}`)
})

// 路由错误处理
router.onError((error) => {
  console.error('Router error:', error)
  // 可以在这里添加错误上报逻辑
})

export default router