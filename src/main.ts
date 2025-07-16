import './assets/main.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// v-md-editor 配置
import VMdEditor from '@kangc/v-md-editor'
import '@kangc/v-md-editor/lib/style/base-editor.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js'
import '@kangc/v-md-editor/lib/theme/style/github.css'

// highlightjs
import hljs from 'highlight.js'

VMdEditor.use(githubTheme, {
  Hljs: hljs,
})

import App from './App.vue'
import router from './router'
import { useSchedulerStore } from './store/scheduler'

// 初始化全局WebSocket连接
import { initGlobalWebSockets } from './utils/globalWebSocketManager'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(VMdEditor)

// 初始化全局WebSocket连接
initGlobalWebSockets()

// Connect to WebSocket (保持向后兼容)
const schedulerStore = useSchedulerStore()
schedulerStore.connect()

app.mount('#app') 