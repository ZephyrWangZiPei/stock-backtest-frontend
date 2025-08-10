import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes } from '../store/modules/permission'

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export default router 
