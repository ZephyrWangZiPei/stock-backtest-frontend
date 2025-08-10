import { defineStore } from 'pinia'

interface AppState {
  sidebar: {
    opened: boolean
    withoutAnimation: boolean
    showLogo: boolean
  }
  device: string
  fixedHeader: boolean
  size: string
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebar: {
      opened: true,
      withoutAnimation: false,
      showLogo: true
    },
    device: 'desktop',
    fixedHeader: true,
    size: 'medium'
  }),

  actions: {
    toggleSideBar() {
      this.sidebar.opened = !this.sidebar.opened
      this.sidebar.withoutAnimation = false
    },

    closeSideBar(withoutAnimation: boolean) {
      this.sidebar.opened = false
      this.sidebar.withoutAnimation = withoutAnimation
    },

    toggleDevice(device: string) {
      this.device = device
    },

    toggleFixedHeader(fixedHeader: boolean) {
      this.fixedHeader = fixedHeader
    },

    setSize(size: string) {
      this.size = size
    }
  }
}) 