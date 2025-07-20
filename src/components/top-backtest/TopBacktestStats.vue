<template>
  <div class="top-backtest-stats">
    <div class="stats-grid">
      <el-card
        v-for="stat in stats"
        :key="stat.key"
        class="stat-card"
        :class="`stat-card--${stat.variant}`"
        shadow="hover"
      >
        <div class="stat-content">
          <div class="stat-icon" :class="`stat-icon--${stat.variant}`">
            <el-icon>
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value" :class="`stat-value--${stat.variant}`">
              {{ stat.formattedValue }}
            </div>
            <div class="stat-label">
              {{ stat.label }}
            </div>
            <div v-if="stat.subtitle" class="stat-subtitle">
              {{ stat.subtitle }}
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendCharts, User, Trophy, DataAnalysis } from '@element-plus/icons-vue'
import { formatPercentage, formatNumber } from '@/utils/formatters'

// =============================================================================
// 类型定义
// =============================================================================

interface StatItem {
  key: string
  label: string
  value: number
  formattedValue: string
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  icon: any
  subtitle?: string
}

import type { TopStrategyStock } from '@/types/api'

interface Props {
  /** Top策略股票数据 */
  topStocks?: TopStrategyStock[]
  /** 加载状态 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  topStocks: () => [],
  loading: false
})

// =============================================================================
// 计算属性
// =============================================================================

/**
 * 统计数据
 */
const stats = computed((): StatItem[] => {
  if (!props.topStocks || props.topStocks.length === 0) {
    return [
      {
        key: 'total-stocks',
        label: '总股票数',
        value: 0,
        formattedValue: '0',
        variant: 'info',
        icon: User,
        subtitle: '暂无数据'
      },
      {
        key: 'avg-return',
        label: '平均收益率',
        value: 0,
        formattedValue: '0.00%',
        variant: 'primary',
        icon: TrendCharts,
        subtitle: '暂无数据'
      },
      {
        key: 'avg-win-rate',
        label: '平均胜率',
        value: 0,
        formattedValue: '0.0%',
        variant: 'success',
        icon: Trophy,
        subtitle: '暂无数据'
      },
      {
        key: 'avg-profit-factor',
        label: '平均盈亏比',
        value: 0,
        formattedValue: '0.00',
        variant: 'warning',
        icon: DataAnalysis,
        subtitle: '暂无数据'
      }
    ]
  }

  const totalStocks = props.topStocks.length
  const avgReturn = props.topStocks.reduce((sum, stock) => sum + (stock.total_return || 0), 0) / totalStocks
  const avgWinRate = props.topStocks.reduce((sum, stock) => sum + stock.win_rate, 0) / totalStocks
  const avgProfitFactor = props.topStocks.reduce((sum, stock) => sum + (stock.profit_factor || 0), 0) / totalStocks

  return [
    {
      key: 'total-stocks',
      label: '总股票数',
      value: totalStocks,
      formattedValue: formatNumber(totalStocks),
      variant: 'info',
      icon: User,
      subtitle: '筛选出的优质股票'
    },
    {
      key: 'avg-return',
      label: '平均收益率',
      value: avgReturn,
      formattedValue: formatPercentage(avgReturn, 2),
      variant: 'primary',
      icon: TrendCharts,
      subtitle: '所有策略平均收益'
    },
    {
      key: 'avg-win-rate',
      label: '平均胜率',
      value: avgWinRate,
      formattedValue: formatPercentage(avgWinRate, 1),
      variant: 'success',
      icon: Trophy,
      subtitle: '交易胜率统计'
    },
    {
      key: 'avg-profit-factor',
      label: '平均盈亏比',
      value: avgProfitFactor,
      formattedValue: formatNumber(avgProfitFactor, 2),
      variant: 'warning',
      icon: DataAnalysis,
      subtitle: '盈利与亏损比例'
    }
  ]
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/mixins.scss' as *;

.top-backtest-stats {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;

  @include mobile {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;

  &--primary {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  &--success {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }

  &--warning {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
  }

  &--info {
    background: var(--el-color-info-light-9);
    color: var(--el-color-info);
  }
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;

  &--primary {
    color: var(--el-color-primary);
  }

  &--success {
    color: var(--el-color-success);
  }

  &--warning {
    color: var(--el-color-warning);
  }

  &--info {
    color: var(--el-color-info);
  }
}

.stat-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.stat-subtitle {
  font-size: 12px;
  opacity: 0.7;
}
</style> 