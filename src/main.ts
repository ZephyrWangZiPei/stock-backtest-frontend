import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 启用 Element Plus 官方暗黑主题
import 'element-plus/theme-chalk/dark/css-vars.css'

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

// 引入全局样式
import './assets/styles/global.scss'

// 创建Vue应用实例
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.use(VMdEditor)

// 挂载应用
app.mount('#app') 
