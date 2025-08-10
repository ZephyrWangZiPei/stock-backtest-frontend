import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 导入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 导入全局样式
import '@/assets/styles/variables.scss'
import '@/assets/styles/global.scss'

// 导入store
import { usePermissionStore } from './store/modules/permission'

// 导入WebSocket连接池
import { websocketConnectionPool } from './utils/websocketConnectionPool'

const app = createApp(App)

app.use(store)
app.use(router)
app.use(ElementPlus)

// 初始化路由
const permissionStore = usePermissionStore()
permissionStore.generateRoutes()

// 初始化WebSocket连接
const initWebSocketConnections = async () => {
  try {
    console.log('🔌 初始化WebSocket连接...')
    await websocketConnectionPool.connectToNamespace('/data_collection')
    await websocketConnectionPool.connectToNamespace('/ai_analysis')
    console.log('✅ WebSocket连接初始化完成')
  } catch (error) {
    console.error('❌ WebSocket连接初始化失败:', error)
  }
}

// 启动应用
app.mount('#app')

// 应用挂载后初始化WebSocket
initWebSocketConnections() 
