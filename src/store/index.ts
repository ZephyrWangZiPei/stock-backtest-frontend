import { createPinia } from 'pinia'

const store = createPinia()

export default store

// 导出所有store模块
export * from './modules/app'
export * from './modules/permission' 