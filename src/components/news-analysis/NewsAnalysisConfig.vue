<template>
  <div class="config-wrapper">
    <div class="config-header">
      <div class="header-left">
        <div class="flex items-center space-x-3">
          <div class="w-2 h-2 bg-blue-400 rounded-md animate-pulse"></div>
          <span
            class="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">分析配置</span>
        </div>
      </div>
      <div class="header-right">
        <el-tag
          :type="isConnected ? 'success' : 'danger'"
          size="small"
          class="connection-tag"
          effect="dark"
        >
          <el-icon class="tag-icon">
            <component :is="isConnected ? 'CircleCheck' : 'CircleClose'" />
          </el-icon>
          {{ isConnected ? '已连接' : '未连接' }}
        </el-tag>
      </div>
    </div>

    <div class="config-content">
      <el-form
        label-position="top"
        class="config-form"
      >
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">股票搜索</label>
            <div class="form-control">
              <StockSelector
                v-model="selectedStockCode"
                :disabled="disabled"
                placeholder="输入股票代码或名称搜索"
                @change="handleStockChange"
                @clear="handleStockClear"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">已选股票</label>
            <div class="form-control">
              <div
                v-if="selectedStock"
                class="selected-stock"
              >
                <el-tag
                  type="primary"
                  closable
                  class="stock-tag"
                  effect="dark"
                  @close="handleStockClear"
                >
                  <div class="stock-info">
                    <span class="stock-code">{{ selectedStock.code }}</span>
                    <span class="stock-name">{{ selectedStock.name }}</span>
                  </div>
                </el-tag>
              </div>
              <div
                v-else
                class="no-stock-selected"
              >
                <el-icon class="placeholder-icon">
                  <Search />
                </el-icon>
                <span class="placeholder-text">请先搜索并选择股票</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">分析日期</label>
            <div class="form-control">
              <el-date-picker
                v-model="analysisDate"
                type="date"
                placeholder="选择分析日期"
                :disabled="disabled"
                class="date-picker"
              />
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button
            @click="handleStartAnalysis"
            :disabled="!canStartAnalysis || disabled"
            class="action-btn action-btn-primary w-full"
          >
            <div class="flex items-center justify-center space-x-3">
              <div class="w-6 h-6 bg-purple-500/20 rounded-sm flex items-center justify-center">
                <div
                  class="w-3 h-3 bg-purple-400 rounded-xs"
                  :class="loading ? 'animate-spin' : ''"
                ></div>
              </div>
              <span class="font-medium text-lg">
                {{ loading ? '分析中...' : '开始新闻分析' }}
              </span>
            </div>
            <div
              v-if="loading"
              class="absolute inset-0 bg-purple-500/10 rounded-md animate-pulse"
            ></div>
          </button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CircleCheck, CircleClose, Search } from '@element-plus/icons-vue'
import StockSelector from '@/components/common/StockSelector.vue'
import type { Stock } from '@/types/api'

/**
 * 组件属性
 */
interface Props {
  /** 是否已连接 */
  isConnected: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 选中的股票 */
  selectedStock?: Stock | null
  /** 分析日期 */
  analysisDate?: string
}

/**
 * 组件事件
 */
interface Emits {
  /** 开始分析事件 */
  (e: 'start-analysis', data: { stockCode: string; analysisDate: string }): void
  /** 股票选择事件 */
  (e: 'stock-select', stock: Stock): void
  /** 股票清除事件 */
  (e: 'stock-clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  selectedStock: null,
  analysisDate: ''
})

const emit = defineEmits<Emits>()

// 响应式数据
const selectedStockCode = ref('')
const analysisDate = ref(props.analysisDate)

// 计算属性
const canStartAnalysis = computed(() => {
  return props.selectedStock && analysisDate.value && props.isConnected
})

// 方法
const handleStockChange = (value: Stock | string | string[]) => {
  if (typeof value === 'object' && 'code' in value) {
    // 单选模式，value是Stock对象
    emit('stock-select', value as Stock)
  } else if (typeof value === 'string') {
    // 单选模式，value是股票代码字符串
    selectedStockCode.value = value
  }
}

const handleStockClear = () => {
  selectedStockCode.value = ''
  emit('stock-clear')
}

const handleStartAnalysis = () => {
  if (!canStartAnalysis.value || !props.selectedStock) return

  emit('start-analysis', {
    stockCode: props.selectedStock.code,
    analysisDate: analysisDate.value
  })
}

// 监听外部变化
watch(() => props.selectedStock, (newStock) => {
  if (newStock) {
    selectedStockCode.value = newStock.code
  } else {
    selectedStockCode.value = ''
  }
})

watch(() => props.analysisDate, (newDate) => {
  analysisDate.value = newDate
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.config-wrapper {
  .config-header {
    @include flex(row, space-between, center);
    padding: $spacing-xl;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    
      .header-left {
          @include flex(row, flex-start, center);
          gap: $spacing-sm;
          }
          
          .header-right {
            .connection-tag {
              @include flex(row, center, center);
              gap: $spacing-xs;
              padding: $spacing-xs $spacing-sm;
              border-radius: $card-border-radius;
              font-weight: $font-weight-medium;
              background: rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.1);
          
              .tag-icon {
                font-size: $font-size-small;
              }
            }
          }
          }
          
          .config-content {
            padding: $spacing-xxl;
          
            .config-form {
              .form-row {
                @include grid(3, $spacing-xl);
                margin-bottom: $spacing-xxl;
          
                @include respond-to(md) {
                  grid-template-columns: repeat(2, 1fr);
                }
          
                @include respond-to(sm) {
                  grid-template-columns: 1fr;
                }
              }
          
              .form-group {
                .form-label {
                  display: block;
                  margin-bottom: $spacing-sm;
                  font-weight: $font-weight-medium;
                  color: #e2e8f0;
                  font-size: $font-size-base;
                }
          
                .form-control {
                  .selected-stock {
                    .stock-tag {
                      width: 100%;
                      padding: $spacing-md;
                      border-radius: $card-border-radius;
                      border: 1px solid rgba(59, 130, 246, 0.5);
                      background: rgba(59, 130, 246, 0.1);
          
                      .stock-info {
                        @include flex(column, center, flex-start);
                        gap: $spacing-xs;
          
                        .stock-code {
                          font-size: $font-size-medium;
                          font-weight: $font-weight-bold;
                          color: #60a5fa;
                        }
          
                        .stock-name {
                          font-size: $font-size-small;
                          color: #94a3b8;
                        }
                      }
                    }
                  }
          
                  .no-stock-selected {
                    @include flex(column, center, center);
                    height: 80px;
                    border: 2px dashed rgba(148, 163, 184, 0.3);
                    border-radius: $card-border-radius;
                    background: rgba(51, 65, 85, 0.3);
                    gap: $spacing-sm;
          
                    .placeholder-icon {
                      font-size: $font-size-large;
                      color: #64748b;
                    }
          
                    .placeholder-text {
                      color: #64748b;
                      font-size: $font-size-small;
                    }
                  }
          
                  .date-picker {
                    width: 100%;
                  }
                }
              }
          
              .form-actions {
                @include flex(row, center, center);
                padding-top: $spacing-lg;
                border-top: 1px solid rgba(148, 163, 184, 0.2);
          
                .action-btn {
                  @include flex(row, center, center);
                  gap: $spacing-sm;
                  padding: $spacing-md $spacing-xxl;
                  font-size: $font-size-medium;
                  font-weight: $font-weight-medium;
                  border-radius: $card-border-radius * 2;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  transition: all $transition-base $ease-in-out;
                  position: relative;
                  overflow: hidden;
                  border: none;
                  cursor: pointer;
          
                  &:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                  }
          
                  &:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                  }
          
                  &.action-btn-primary {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
          
                    &:hover:not(:disabled) {
                      background: linear-gradient(135deg, #2563eb, #7c3aed);
                    }
                  }
                }
              }
            }
          }
          }
          
          // 响应式设计
          @include respond-to(sm) {
            .config-wrapper {
              .config-content {
                padding: $spacing-lg;
          
                .config-form {
                  .form-row {
                    gap: $spacing-lg;
                  }
                }
    }
  }
}
</style> 