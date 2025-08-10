import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { unifiedWebSocketManager } from '@/utils/unifiedWebSocketManager'

export interface BacktestResult {
  id: string
  strategy: string
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  winRate: number
  totalTrades: number
  startDate: string
  endDate: string
}

export function useBacktestWebSocket() {
  const isConnected = ref(false)
  const backtestResults = ref<BacktestResult[]>([])
  const currentBacktest = ref<any>(null)
  const backtestProgress = ref(0)

  const connectToBacktest = async () => {
    try {
      await unifiedWebSocketManager.connect('/backtest')
      isConnected.value = true

      // 设置回测相关事件监听
      unifiedWebSocketManager.on('/backtest', 'backtest_started', (data: any) => {
        currentBacktest.value = data
        backtestProgress.value = 0
      })

      unifiedWebSocketManager.on('/backtest', 'backtest_progress', (data: any) => {
        backtestProgress.value = data.progress || 0
      })

      unifiedWebSocketManager.on('/backtest', 'backtest_completed', (data: any) => {
        if (data.result) {
          backtestResults.value.push(data.result)
        }
        currentBacktest.value = null
        backtestProgress.value = 100
      })

      unifiedWebSocketManager.on('/backtest', 'backtest_error', (data: any) => {
        console.error('Backtest error:', data.error)
        currentBacktest.value = null
      })

    } catch (error) {
      console.error('Failed to connect to backtest service:', error)
      isConnected.value = false
    }
  }

  const startBacktest = (config: any) => {
    if (isConnected.value) {
      unifiedWebSocketManager.emit('/backtest', 'start_backtest', config)
    }
  }

  const stopBacktest = () => {
    if (isConnected.value) {
      unifiedWebSocketManager.emit('/backtest', 'stop_backtest', {})
    }
  }

  const cleanup = () => {
    unifiedWebSocketManager.clearEventListeners('/backtest')
    unifiedWebSocketManager.disconnect('/backtest')
    isConnected.value = false
  }

  onMounted(() => {
    connectToBacktest()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    isConnected,
    backtestResults,
    currentBacktest,
    backtestProgress,
    startBacktest,
    stopBacktest,
    cleanup
  }
} 
