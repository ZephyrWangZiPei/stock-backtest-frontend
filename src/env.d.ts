/// <reference types="vite/client" />

// Vue 模块声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// v-md-editor 模块声明
declare module '@kangc/v-md-editor' {
  import { App } from 'vue'
  const VMdEditor: {
    install(app: App): void
    use(theme: any, options?: any): void
  }
  export default VMdEditor
}

declare module '@kangc/v-md-editor/lib/theme/github.js' {
  const githubTheme: any
  export default githubTheme
}

// 环境变量类型声明
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WS_URL?: string
  readonly BASE_URL: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}