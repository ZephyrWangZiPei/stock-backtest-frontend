<template>
  <div class="backtest-container">
    <!-- Header moved to NavBar -->

    <div class="backtest-content">
      <el-row
        :gutter="24"
        class="h-full"
      >
        <!-- Left Panel: Configuration -->
        <el-col
          :span="10"
          class="h-full"
        >
          <div class="relative group h-full">
            <div
              class="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"
            ></div>
            <el-card
              shadow="never"
              class="relative h-full border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
            >
              <template #header>
                <div class="flex items-center space-x-3">
                  <div class="w-2 h-2 bg-blue-400 rounded-md animate-pulse"></div>
                  <span
                    class="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                  >回测设置</span>
                </div>
              </template>

              <div class="h-full overflow-y-auto custom-scrollbar">
                <el-form
                  :model="form"
                  label-position="top"
                  class="custom-form"
                >
                  <el-form-item label="选择策略">
                    <el-select
                      v-model="form.strategy_id"
                      placeholder="请选择策略"
                      @change="onStrategyChange"
                      class="w-full custom-select"
                    >
                      <el-option
                        v-for="item in strategyOptions"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item>
                    <template #label>
                      <span>初始资金</span>
                      <el-tooltip
                        content="回测开始时使用的虚拟资金总额"
                        placement="top"
                      >
                        <el-icon class="ml-1 align-middle">
                          <QuestionFilled />
                        </el-icon>
                      </el-tooltip>
                    </template>
                    <el-input-number
                      v-model="form.initial_capital"
                      :min="1000"
                      :step="1000"
                      class="w-full custom-input-number"
                    />
                  </el-form-item>

                  <el-alert
                    v-if="strategyDescription"
                    :title="strategyDescription"
                    type="info"
                    :closable="false"
                    class="mb-5 custom-alert"
                  />

                  <!-- 动态参数表单 -->
                  <div
                    v-if="parameterDefinitions.length > 0"
                    class="pt-5 mt-5 border-t border-gray-600/50"
                  >
                    <h3 class="text-base font-medium mb-4 text-gray-200">策略参数</h3>
                    <el-row :gutter="20">
                      <el-col
                        :span="12"
                        v-for="param in parameterDefinitions"
                        :key="param.name"
                      >
                        <el-form-item :label="param.label">
                          <template #label>
                            <span>{{ param.label }}</span>
                            <el-tooltip
                              :content="param.description"
                              placement="top"
                              v-if="param.description"
                            >
                              <el-icon class="ml-1 align-middle">
                                <QuestionFilled />
                              </el-icon>
                            </el-tooltip>
                          </template>
                          <el-input-number
                            v-if="param.type === 'number'"
                            v-model="formParameters[param.name]"
                            class="w-full custom-input-number"
                          />
                          <el-input
                            v-else
                            v-model="formParameters[param.name]"
                            class="w-full custom-input"
                          />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </div>

                  <el-form-item class="mt-5">
                    <template #label>
                      <span>回测日期</span>
                      <el-tooltip
                        content="回测模拟交易的时间区间"
                        placement="top"
                      >
                        <el-icon class="ml-1 align-middle">
                          <QuestionFilled />
                        </el-icon>
                      </el-tooltip>
                    </template>
                    <el-date-picker
                      v-model="form.date_range"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      class="w-full custom-date-picker"
                    />
                  </el-form-item>

                  <el-form-item>
                    <template #label>
                      <span>选择股票</span>
                      <el-tooltip
                        content="选择一只或多只股票进行回测"
                        placement="top"
                      >
                        <el-icon class="ml-1 align-middle">
                          <QuestionFilled />
                        </el-icon>
                      </el-tooltip>
                    </template>
                    <StockSelector
                      v-model="form.stock_codes"
                      :multiple="true"
                      :disabled="loading"
                      placeholder="输入股票代码或名称搜索"
                      @change="handleStockSelectionChange"
                    />
                  </el-form-item>

                  <el-form-item class="mt-6">
                    <button
                      @click="onSubmit"
                      :disabled="loading"
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
                          {{ loading ? '正在回测...' : '开始回测' }}
                        </span>
                      </div>
                      <div
                        v-if="loading"
                        class="absolute inset-0 bg-purple-500/10 rounded-md animate-pulse"
                      ></div>
                    </button>
                  </el-form-item>
                </el-form>
              </div>
            </el-card>
          </div>
        </el-col>

        <!-- Right Panel: Results -->
        <el-col
          :span="14"
          class="h-full"
        >
          <div class="relative group h-full">
            <div
              class="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"
            >
            </div>
            <el-card
              v-if="backtestResult"
              class="relative h-full border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl hover:shadow-green-500/10 transition-all duration-300"
            >
              <template #header>
                <div class="flex justify-between items-center">
                  <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 bg-green-400 rounded-md animate-pulse"></div>
                    <span
                      class="font-bold text-xl bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent"
                    >
                      回测结果 (ID: {{ backtestResult.id }})
                    </span>
                  </div>
                </div>
              </template>

              <div class="h-full overflow-y-auto custom-scrollbar">
                <div v-if="backtestResult.status === 'running'">
                  <div class="flex flex-col items-center justify-center p-16">
                    <el-progress
                      type="circle"
                      :percentage="pollProgress"
                      class="mb-6"
                    />
                    <p class="text-gray-300 text-lg">正在努力回测中，请稍候...</p>
                  </div>
                </div>
                <div v-else-if="backtestResult.status === 'completed' && backtestResult.data">

                  <div
                    class="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4 text-center p-6 rounded-md bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/30 mb-6"
                  >
                    <div
                      class="kpi-item p-4 rounded-sm transition-all duration-300 hover:bg-gray-700/30 hover:scale-105"
                    >
                      <div class="text-sm text-gray-400 mb-2">初始资产</div>
                      <div class="text-xl font-semibold text-white">{{ new
                        Intl.NumberFormat('en-US').format(backtestResult.data.initial_capital) }}</div>
                    </div>
                    <div
                      class="kpi-item p-4 rounded-sm transition-all duration-300 hover:bg-gray-700/30 hover:scale-105"
                    >
                      <div class="text-sm text-gray-400 mb-2">最终资产</div>
                      <div class="text-xl font-semibold text-white">{{ new
                        Intl.NumberFormat('en-US').format(backtestResult.data.final_capital) }}</div>
                    </div>
                    <div
                      class="kpi-item p-4 rounded-sm transition-all duration-300 hover:bg-gray-700/30 hover:scale-105"
                    >
                      <div class="text-sm text-gray-400 mb-2">总回报率</div>
                      <div
                        :class="['text-xl font-semibold', performanceMetrics.totalReturn >= 0 ? 'text-red-500' : 'text-green-500']"
                      >
                        {{ (performanceMetrics.totalReturn * 100).toFixed(2) }}%
                      </div>
                    </div>
                    <div
                      class="kpi-item p-4 rounded-sm transition-all duration-300 hover:bg-gray-700/30 hover:scale-105"
                    >
                      <div class="text-sm text-gray-400 mb-2">年化回报率</div>
                      <div
                        :class="['text-xl font-semibold', performanceMetrics.annualReturn >= 0 ? 'text-red-500' : 'text-green-500']"
                      >
                        {{ (performanceMetrics.annualReturn * 100).toFixed(2) }}%
                      </div>
                    </div>
                    <div
                      class="kpi-item p-4 rounded-sm transition-all duration-300 hover:bg-gray-700/30 hover:scale-105"
                    >
                      <div class="text-sm text-gray-400 mb-2">最大回撤</div>
                      <div class="text-xl font-semibold text-green-500">
                        {{ (performanceMetrics.maxDrawdown * 100).toFixed(2) }}%
                      </div>
                    </div>
                    <div
                      class="kpi-item p-4 rounded-sm transition-all duration-300 hover:bg-gray-700/30 hover:scale-105"
                    >
                      <div class="text-sm text-gray-400 mb-2">夏普比率</div>
                      <div class="text-xl font-semibold text-white">{{ performanceMetrics.sharpeRatio.toFixed(2) }}
                      </div>
                    </div>
                    <div
                      class="kpi-item p-4 rounded-sm transition-all duration-300 hover:bg-gray-700/30 hover:scale-105"
                    >
                      <div class="text-sm text-gray-400 mb-2">总交易次数</div>
                      <div class="text-xl font-semibold text-white">{{ performanceMetrics.totalTrades }}</div>
                    </div>
                    <div
                      class="kpi-item p-4 rounded-sm transition-all duration-300 hover:bg-gray-700/30 hover:scale-105"
                    >
                      <div class="text-sm text-gray-400 mb-2">胜率</div>
                      <div class="text-xl font-semibold text-white">
                        {{ (performanceMetrics.winRate * 100).toFixed(2) }}%
                      </div>
                    </div>
                    <div
                      class="kpi-item p-4 rounded-sm transition-all duration-300 hover:bg-gray-700/30 hover:scale-105"
                    >
                      <div class="text-sm text-gray-400 mb-2">盈亏比</div>
                      <div class="text-xl font-semibold text-white">{{ performanceMetrics.profitFactor.toFixed(2) }}
                      </div>
                    </div>
                  </div>

                  <!-- 股票切换选择器 -->
                  <el-form-item
                    v-if="form.stock_codes.length > 1"
                    label="查看图表"
                    class="mb-6"
                  >
                    <el-select
                      v-model="chartStock"
                      placeholder="请选择要查看的股票K线"
                      class="custom-select"
                    >
                      <el-option
                        v-for="code in form.stock_codes"
                        :key="code"
                        :label="getStockName(code)"
                        :value="code"
                      />
                    </el-select>
                  </el-form-item>

                  <el-tabs
                    v-model="activeTab"
                    class="custom-tabs"
                  >
                    <el-tab-pane
                      label="业绩图表"
                      name="chart"
                    >
                      <div
                        ref="chartRef"
                        style="width: 100%; height: 500px;"
                        class="mt-5 rounded-md border border-gray-700/30"
                      >
                      </div>
                    </el-tab-pane>
                    <el-tab-pane
                      label="交易日志"
                      name="trades"
                    >
                      <el-table
                        :data="filteredTrades"
                        class="custom-table"
                      >
                        <el-table-column
                          prop="trade_date"
                          label="交易日期"
                          width="180"
                        />
                        <el-table-column
                          prop="stock_code"
                          label="股票代码"
                          width="120"
                        />
                        <el-table-column
                          prop="trade_type"
                          label="操作"
                          width="100"
                        >
                          <template #default="scope">
                            <el-tag
                              :type="scope.row.trade_type === 'buy' ? 'success' : 'danger'"
                              effect="dark"
                              class="!font-bold custom-tag"
                            >
                              {{ scope.row.trade_type.toUpperCase() }}
                            </el-tag>
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="price"
                          label="成交价"
                        />
                        <el-table-column
                          prop="quantity"
                          label="股数"
                        />
                      </el-table>
                    </el-tab-pane>
                    <el-tab-pane
                      label="AI 分析"
                      name="ai-analysis"
                    >
                      <div class="ai-analysis-container">
                        <!-- AI 分析控制区域 -->
                        <div
                          class="mb-6 p-4 rounded-md bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-700/30"
                        >
                          <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                              <div class="w-2 h-2 bg-blue-400 rounded-md animate-pulse"></div>
                              <span
                                class="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                              >
                                AI 智能分析
                              </span>
                            </div>
                            <div class="flex items-center space-x-3">
                              <button
                                v-if="!aiAnalysisLoading && !aiAnalysisCompleted"
                                @click="startAiAnalysis"
                                class="action-btn action-btn-primary"
                              >
                                <div class="flex items-center space-x-2">
                                  <div class="w-4 h-4 bg-purple-400 rounded-sm"></div>
                                  <span>开始分析</span>
                                </div>
                              </button>
                              <button
                                v-if="aiAnalysisCompleted"
                                @click="resetAiAnalysis"
                                class="action-btn action-btn-secondary"
                              >
                                <div class="flex items-center space-x-2">
                                  <div class="w-4 h-4 bg-gray-400 rounded-sm"></div>
                                  <span>重新分析</span>
                                </div>
                              </button>
                            </div>
                          </div>
                          <p class="text-sm text-gray-400 mt-2">
                            基于回测结果和最新市场数据，AI将为您提供专业的策略分析和投资建议
                          </p>
                        </div>

                        <!-- AI 分析内容显示区域 -->
                        <div
                          v-if="aiAnalysisLoading || aiAnalysisCompleted || aiAnalysisError"
                          class="ai-content-area"
                        >
                          <!-- 加载状态 -->
                          <div
                            v-if="aiAnalysisLoading"
                            class="flex flex-col items-center justify-center p-8"
                          >
                            <template v-if="!aiAnalysisLoading">
                              <div
                                class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"
                              >
                              </div>
                              <p class="text-gray-300 text-lg">AI正在分析中，请稍候...</p>
                              <p class="text-gray-400 text-sm mt-2">正在获取最新市场数据并生成专业分析报告</p>

                            </template>
                            <v-md-editor
                              v-else
                              v-model="aiAnalysisContent"
                              mode="preview"
                              :height="Math.max(400, aiAnalysisContent.length / 2) + 'px'"
                            />
                          </div>

                          <!-- 错误状态 -->
                          <div
                            v-else-if="aiAnalysisError"
                            class="p-6 rounded-md bg-red-900/20 border border-red-700/30"
                          >
                            <div class="flex items-center space-x-3 mb-3">
                              <div class="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center">
                                <span class="text-red-900 text-xs font-bold">!</span>
                              </div>
                              <span class="font-semibold text-red-400">分析失败</span>
                            </div>
                            <p class="text-red-300">{{ aiAnalysisError }}</p>
                            <button
                              @click="startAiAnalysis"
                              class="mt-4 action-btn action-btn-primary"
                            >
                              重试
                            </button>
                          </div>

                          <!-- 分析结果 -->
                          <div
                            v-else-if="aiAnalysisCompleted && aiAnalysisContent"
                            class="ai-analysis-result"
                          >
                            <div class="mb-4 p-3 rounded-md bg-green-900/20 border border-green-700/30">
                              <div class="flex items-center space-x-3">
                                <div class="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                                  <span class="text-green-900 text-xs font-bold">✓</span>
                                </div>
                                <span class="font-semibold text-green-400">分析完成</span>
                                <span class="text-sm text-gray-400">(内容长度: {{ aiAnalysisContent.length }} 字符)
                                </span>
                              </div>
                            </div>
                            <div class="prose prose-invert max-w-none">
                              <v-md-editor
                                v-model="displayedAnalysisContent"
                                mode="preview"
                                :height="Math.max(400, displayedAnalysisContent.length / 2) + 'px'"
                              />
                              <span
                                v-if="aiAnalysisLoading && typingIntervalId !== null"
                                class="typing-cursor"
                              >|</span>
                            </div>
                          </div>

                          <!-- 调试信息 -->
                          <div
                            v-if="aiAnalysisLoading"
                            class="mt-4 p-3 rounded-md bg-blue-900/20 border border-blue-700/30"
                          >
                            <div class="text-sm text-blue-300">
                              <div>WebSocket 状态: {{ aiAnalysisSocket ? '已连接' : '未连接' }}</div>
                              <div>已接收原始内容长度 (aiAnalysisContent): {{ aiAnalysisContent.length }} 字符</div>
                              <div>已显示内容长度 (displayedAnalysisContent): {{ displayedAnalysisContent.length }} 字符</div>
                              <div>打字机索引 (typingIndex): {{ typingIndex }}</div>
                              <div>最后更新: {{ new Date().toLocaleTimeString() }}</div>
                            </div>
                          </div>
                        </div>

                        <!-- 初始状态 -->
                        <div
                          v-else
                          class="flex flex-col items-center justify-center p-16"
                        >
                          <div
                            class="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-6"
                          >
                            <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-md"></div>
                          </div>
                          <p class="text-lg font-medium text-gray-300 mb-2">AI 智能分析</p>
                          <p class="text-sm text-gray-400 text-center max-w-md">
                            点击"开始分析"按钮，AI将基于您的回测结果提供专业的策略分析和投资建议
                          </p>
                        </div>
                      </div>
                    </el-tab-pane>
                  </el-tabs>
                </div>
                <div v-else>
                  <el-alert
                    type="error"
                    :closable="false"
                    class="custom-alert"
                  >
                    获取结果失败或任务超时。请检查后台日志。
                  </el-alert>
                </div>
              </div>
            </el-card>
            <div
              v-else
              class="relative h-full"
            >
              <div
                class="absolute -inset-1 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-lg blur opacity-50">
              </div>
              <div
                class="relative h-full border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl flex items-center justify-center"
              >
                <div class="text-center">
                  <div class="w-16 h-16 bg-gray-700/50 rounded-md flex items-center justify-center mb-4 mx-auto">
                    <div class="w-8 h-8 border-2 border-gray-600 rounded-md"></div>
                  </div>
                  <p class="text-lg font-medium text-gray-300 mb-2">开始您的策略回测</p>
                  <p class="text-sm text-gray-400">配置参数后点击"开始回测"查看结果</p>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, nextTick, watch, computed, onUnmounted } from 'vue'
import { runBacktest, getStrategies, getStocks, getBacktestResult, getDailyData, getStrategyDetails } from '@/utils/api'
import { ElMessage, ElEmpty } from 'element-plus'
import { createChart, IChartApi, ISeriesApi, CrosshairMode } from 'lightweight-charts';
import { QuestionFilled } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { Socket } from 'socket.io-client'
import { createWebSocketManager, WebSocketManager } from '@/utils/websocketManager'
import { usePageWebSocket } from '@/utils/pageWebSocketManager'
import VMdEditor from '@kangc/v-md-editor'
import StockSelector from '@/components/common/StockSelector.vue'

interface Strategy {
  id: number;
  name: string;
  identifier: string;
}
interface Stock {
  code: string;
  name: string;
}

interface ParameterDefinition {
  name: string;
  label: string;
  type: string;
  default: any;
  description?: string;
}

const route = useRoute();
const router = useRouter();

const form = reactive({
  strategy_id: null as number | null,
  initial_capital: 100000,
  date_range: [new Date(new Date().setFullYear(new Date().getFullYear() - 1)), new Date()],
  stock_codes: [] as string[],
})

const parameterDefinitions = ref<ParameterDefinition[]>([]);
const formParameters = reactive<Record<string, any>>({});
const strategyDescription = ref('');

const backtestResult = ref<{ id: number, status: string, data?: any } | null>(null);
const loading = ref(false);
const pollProgress = ref(0);
const chartStock = ref<string | null>(null);
const activeTab = ref('chart');
const strategyOptions = ref<Strategy[]>([]);
const chartRef = ref<HTMLElement | null>(null);
let chart: IChartApi | null = null;
let candlestickSeries: ISeriesApi<'Candlestick'> | null = null;

// AI 分析相关变量
const aiAnalysisSocket = ref<Socket | null>(null);
const aiAnalysisContent = ref<string>('');
const aiAnalysisLoading = ref<boolean>(false);
const aiAnalysisCompleted = ref<boolean>(false);
const aiAnalysisError = ref<string>('');
const showAiAnalysis = ref<boolean>(false);

// 页面WebSocket连接管理
const { pageManager, checkAndReconnect } = usePageWebSocket()

// 打字机效果相关变量
const displayedAnalysisContent = ref<string>('');
const typingIndex = ref<number>(0);
let typingIntervalId: number | null = null;
const TYPING_SPEED = 50; // 毫秒/字符

// WebSocket 服务器配置
const WS_SERVER_URL = 'http://localhost:5000';

// 打字机效果实现
const startTypingEffect = () => {
  if (typingIntervalId !== null) {
    clearInterval(typingIntervalId);
  }
  typingIntervalId = window.setInterval(() => {
    if (typingIndex.value < aiAnalysisContent.value.length) {
      displayedAnalysisContent.value += aiAnalysisContent.value[typingIndex.value];
      typingIndex.value++;
      // 滚动到底部以显示最新内容
      const container = document.querySelector('.ai-analysis-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } else {
      stopTypingEffect();
    }
  }, TYPING_SPEED);
};

const stopTypingEffect = () => {
  if (typingIntervalId !== null) {
    clearInterval(typingIntervalId);
    typingIntervalId = null;
  }
  typingIndex.value = aiAnalysisContent.value.length; // 确保索引达到末尾
  displayedAnalysisContent.value = aiAnalysisContent.value; // 确保显示完整内容
};

const performanceMetrics = computed(() => {
  if (!backtestResult.value || !backtestResult.value.data) {
    return {
      totalReturn: 0,
      annualReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0, // 暂时保留，或设为 N/A
    };
  }

  const data = backtestResult.value.data;

  // 盈亏比仍在前端计算，因为它可能为无穷大，不适合在数据库中存储
  let totalProfit = 0.0;
  let totalLoss = 0.0;
  const buyMap = new Map<string, { price: number; quantity: number }[]>();

  for (const trade of data.trades || []) {
    if (trade.trade_type === 'buy') {
      if (!buyMap.has(trade.stock_code)) {
        buyMap.set(trade.stock_code, []);
      }
      buyMap.get(trade.stock_code)!.push({ price: trade.price, quantity: trade.quantity });
    } else { // sell
      const buyInfo = buyMap.get(trade.stock_code)?.shift(); // FIFO
      if (buyInfo) {
        const profit = (trade.price - buyInfo.price) * buyInfo.quantity;
        if (profit > 0) {
          totalProfit += profit;
        } else {
          totalLoss += Math.abs(profit);
        }
      }
    }
  }
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : Infinity;

  return {
    // 直接从后端获取的指标
    totalReturn: data.total_return || 0,
    annualReturn: data.annual_return || 0,
    maxDrawdown: data.max_drawdown || 0,
    sharpeRatio: data.sharpe_ratio || 0,
    totalTrades: data.total_trades || 0,
    winRate: data.win_rate || 0,

    // 仍在前端计算的指标
    profitFactor,
  };
});

const filteredTrades = computed(() => {
  const trades = backtestResult.value?.data?.trades;
  if (!trades) {
    return [];
  }

  // For multi-stock backtests, filter by the selected stock.
  if (form.stock_codes.length > 1 && chartStock.value) {
    return trades.filter((trade: any) => trade.stock_code === chartStock.value);
  }

  // For single-stock backtests, show all trades.
  return trades;
});

const getStockName = (code: string) => {
  return code;
};

const loadResultById = async (id: number) => {
  try {
    const res = await getBacktestResult(id);
    const resultData = res.data; // API wrapper -> data
    if (!resultData) {
      throw new Error('无效的回测结果');
    }
    backtestResult.value = {
      id,
      status: resultData.status || 'completed',
      data: resultData,
    };

    // 检查是否有AI分析报告
    if (resultData.ai_analysis_report) {
      aiAnalysisContent.value = resultData.ai_analysis_report;
      displayedAnalysisContent.value = resultData.ai_analysis_report; // 直接显示完整内容
      aiAnalysisCompleted.value = true;
      aiAnalysisLoading.value = false;
      aiAnalysisError.value = '';
      stopTypingEffect(); // 确保停止任何可能的打字效果
    } else {
      // 如果没有AI分析报告，清空相关状态
      aiAnalysisContent.value = '';
      displayedAnalysisContent.value = '';
      aiAnalysisCompleted.value = false;
      aiAnalysisLoading.value = false;
      aiAnalysisError.value = '';
      stopTypingEffect(); // 确保停止任何可能的打字效果
    }

    if (resultData?.selected_stocks?.length) {
      const list: any[] = resultData.selected_stocks;
      form.stock_codes = list.map((item: any) => typeof item === 'string' ? item : item.code);
      chartStock.value = form.stock_codes[0];
    }
  } catch (e: any) {
    ElMessage.error(e.message || '获取回测结果失败');
  }
}

onMounted(async () => {
  try {
    const response = await getStrategies();
    const strategies = response.data || []; // 新结构: response.data 是策略数组
    if (strategies.length > 0) {
      strategyOptions.value = strategies;
      form.strategy_id = strategies[0].id; // 默认选中第一个
      await onStrategyChange(form.strategy_id); // 主动加载第一个策略的参数
    }
  } catch (error) {
    ElMessage.error('获取策略列表失败');
    console.error(error);
  }

  // 如果通过 /backtest?id=xx 进入，直接加载结果
  if (route.query.id) {
    const idNum = Number(route.query.id);
    if (!isNaN(idNum)) {
      await loadResultById(idNum);
    }
  }
});



const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const onStrategyChange = async (strategyId: number | null) => {
  parameterDefinitions.value = [];
  strategyDescription.value = '';
  Object.keys(formParameters).forEach(key => delete formParameters[key]); // 清空旧参数

  if (!strategyId) return;

  const selectedStrategy = strategyOptions.value.find(s => s.id === strategyId);
  if (!selectedStrategy) return;

  try {
    const response = await getStrategyDetails(selectedStrategy.identifier);
    const details = response.data; // 新结构: response.data 包含策略详情
    parameterDefinitions.value = details.parameter_definitions;
    strategyDescription.value = details.description;
    // 根据定义初始化表单参数
    for (const param of parameterDefinitions.value) {
      formParameters[param.name] = param.default;
    }
  } catch (error) {
    ElMessage.error('获取策略参数失败');
    console.error(error);
  }
}

const onSubmit = async () => {
  if (form.strategy_id === null) {
    ElMessage.error('请先选择一个策略');
    return;
  }
  if (form.stock_codes.length === 0) {
    ElMessage.error('请至少选择一只股票');
    return;
  }

  loading.value = true;
  backtestResult.value = null;

  try {
    const payload = {
      strategy_id: form.strategy_id,
      start_date: form.date_range[0].toISOString().split('T')[0],
      end_date: form.date_range[1].toISOString().split('T')[0],
      initial_capital: form.initial_capital,
      stock_codes: form.stock_codes,
      parameters: formParameters, // 附加参数
    };

    const response = await runBacktest(payload);
    const backtestId = response.data.backtest_id;

    ElMessage.success(response.data.message || `回测任务 (ID: ${backtestId}) 已启动`);

    // 开始轮询获取结果
    pollForResult(backtestId);

  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '启动回测失败');
  } finally {
    loading.value = false;
  }
}

const pollForResult = async (id: number, interval = 3000, maxAttempts = 20) => {
  let attempts = 0;

  const executePoll = async (resolve: (value: any) => void, reject: (reason?: any) => void) => {
    attempts++;
    try {
      const response = await getBacktestResult(id);
      const resultData = response.data;

      if (resultData && resultData.status !== 'running') {
        backtestResult.value = { id: id, status: 'completed', data: resultData };
        pollProgress.value = 100;
        ElMessage.success(response.data.message || '回测结果获取成功！');

        // 检查是否有AI分析报告
        if (resultData.ai_analysis_report) {
          aiAnalysisContent.value = resultData.ai_analysis_report;
          displayedAnalysisContent.value = resultData.ai_analysis_report; // 直接显示完整内容
          aiAnalysisCompleted.value = true;
          aiAnalysisLoading.value = false;
          aiAnalysisError.value = '';
          activeTab.value = 'ai-analysis';
          ElMessage.info('检测到AI分析报告，已自动切换到AI分析标签页');
          stopTypingEffect(); // 确保停止任何可能的打字效果
        } else {
          // 如果没有AI分析报告，清空相关状态
          aiAnalysisContent.value = '';
          displayedAnalysisContent.value = '';
          aiAnalysisCompleted.value = false;
          aiAnalysisLoading.value = false;
          aiAnalysisError.value = '';
          stopTypingEffect(); // 确保停止任何可能的打字效果
        }

        await nextTick();
        // 确保在第一次加载时就渲染图表
        if (form.stock_codes.length > 0) {
          chartStock.value = form.stock_codes[0];
        }
        if (chartStock.value) {
          renderChart(resultData, chartStock.value);
        }
        return resolve(resultData);
      } else if (attempts >= maxAttempts) {
        backtestResult.value = { id, status: 'error' };
        return reject(new Error('获取回测结果超时'));
      } else {
        backtestResult.value = { id, status: 'running' };
        pollProgress.value = Math.round((attempts / maxAttempts) * 100);
        setTimeout(() => executePoll(resolve, reject), interval);
      }
    } catch (error) {
      return reject(error);
    }
  };

  return new Promise((resolve, reject) => {
    executePoll(resolve, reject);
  }).catch(error => {
    ElMessage.error(error.message || '获取回测结果失败');
    backtestResult.value = { id, status: 'error' };
  });
}

watch(chartStock, (newStockCode) => {
  if (newStockCode && backtestResult.value && backtestResult.value.data) {
    // 确保图表在Tab切换后也能被正确渲染
    nextTick(() => {
      renderChart(backtestResult.value!.data, newStockCode);
    });
  }
});

const renderChart = async (resultData: any, stockCode: string) => {
  if (!chartRef.value || !resultData.portfolio_history) return;

  // 获取真实的日线数据
  const dailyDataResponse = await getDailyData(
    stockCode,
    formatDate(form.date_range[0]),
    formatDate(form.date_range[1])
  );
  const dailyData = dailyDataResponse.data || [];

  const candlestickData = dailyData.map((d: any) => ({
    time: d.trade_date.split('T')[0],
    open: d.open_price,
    high: d.high_price,
    low: d.low_price,
    close: d.close_price
  }));

  const portfolioHistory = resultData.portfolio_history;
  const portfolioData = portfolioHistory.map((p: any) => ({
    time: p.date.split('T')[0],
    value: p.total
  }));

  // 创建交易标记
  const tradeMarkers = (resultData.trades || [])
    .filter((t: any) => t.stock_code === stockCode)
    .map((trade: any) => {
      const date = trade.trade_date.split('T')[0];
      const isBuy = trade.trade_type === 'buy';
      return {
        time: date,
        position: isBuy ? 'belowBar' : 'aboveBar',
        color: isBuy ? '#2196F3' : '#E91E63',
        shape: isBuy ? 'arrowUp' : 'arrowDown',
        text: isBuy ? `买入 @ ${trade.price.toFixed(2)}` : `卖出 @ ${trade.price.toFixed(2)}`
      };
    });

  if (chart) {
    chart.remove();
    chart = null;
  }

  const chartOptions = {
    layout: {
      background: { color: '#1E222D' },
      textColor: '#D1D4DC',
    },
    grid: {
      vertLines: { color: '#2A2E39' },
      horzLines: { color: '#2A2E39' },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
    },
    rightPriceScale: {
      borderColor: '#485158',
    },
    leftPriceScale: {
      visible: true,
      borderColor: '#485158',
    },
    timeScale: {
      borderColor: '#485158',
      timeVisible: true,
      secondsVisible: false,
    },
    watermark: {
      color: 'rgba(209, 212, 220, 0.1)',
      visible: true,
      text: stockCode,
      fontSize: 48,
      horzAlign: 'center',
      vertAlign: 'center',
    },
  };

  chart = createChart(chartRef.value, chartOptions as any);

  // Candlestick Series on the right scale
  candlestickSeries = chart.addCandlestickSeries({
    upColor: '#E2363A',
    downColor: '#00B164',
    borderDownColor: '#00B164',
    borderUpColor: '#E2363A',
    wickDownColor: '#00B164',
    wickUpColor: '#E2363A',
  });

  candlestickSeries.setData(candlestickData);
  candlestickSeries.setMarkers(tradeMarkers);

  // Volume Series as an overlay
  const volumeSeries = chart.addHistogramSeries({
    priceFormat: {
      type: 'volume',
    },
    priceScaleId: '', // set as an overlay
  });

  // 假设您的 dailyData 包含成交量 (volume)
  const volumeData = dailyData.map((d: any) => ({
    time: d.trade_date.split('T')[0],
    value: d.volume,
    color: d.close_price > d.open_price ? 'rgba(226, 54, 58, 0.5)' : 'rgba(0, 177, 100, 0.5)',
  }));
  volumeSeries.setData(volumeData);

  // Asset line on the left scale
  const assetSeries = chart.addLineSeries({
    color: '#3B82F6',
    lineWidth: 2,
    priceScaleId: 'left',
  });
  assetSeries.setData(portfolioData);


  chart.timeScale().fitContent();
}

// AI 分析相关函数
const startAiAnalysis = async () => {
  if (!backtestResult.value || backtestResult.value.status !== 'completed') {
    ElMessage.error('请先完成回测');
    return;
  }

  // 重置状态
  aiAnalysisContent.value = '';
  displayedAnalysisContent.value = '';
  typingIndex.value = 0;
  aiAnalysisLoading.value = true;
  aiAnalysisCompleted.value = false;
  aiAnalysisError.value = '';
  stopTypingEffect(); // 确保开始前停止任何旧的打字效果

  try {
    // 检查是否已有缓存的AI分析报告
    if (backtestResult.value.data?.ai_analysis_report) {
      aiAnalysisContent.value = backtestResult.value.data.ai_analysis_report;
      displayedAnalysisContent.value = aiAnalysisContent.value; // 直接显示完整内容
      aiAnalysisLoading.value = false;
      aiAnalysisCompleted.value = true;
      ElMessage.success('已加载缓存的AI分析报告');
      stopTypingEffect(); // 确保停止打字效果
      return;
    }

    // 建立WebSocket连接
    const wsManager = createWebSocketManager({
      url: WS_SERVER_URL + '/ai_analysis',
      path: '/socket.io',
      transports: ['websocket'],
      connectionName: 'ai_analysis',
      onConnect: (socket) => {
        // 发送开始分析请求
        socket.emit('start_ai_analysis', { backtest_id: backtestResult.value!.id });
        startTypingEffect(); // 连接成功后开始打字效果
      },
      onDisconnect: (socket) => {
        // 如果不是因为完成或错误而断开，也停止打字效果
        if (!aiAnalysisCompleted.value && !aiAnalysisError.value) {
          stopTypingEffect();
          ElMessage.warning('AI分析连接断开');
        }
      },
      onConnectError: (error) => {
        console.error('WebSocket连接错误:', error);
        stopTypingEffect(); // 停止打字效果
        aiAnalysisLoading.value = false;
        aiAnalysisError.value = 'WebSocket连接失败';
        displayedAnalysisContent.value = '无法连接到AI分析服务。请检查后端服务是否运行。'; // 显示连接错误信息
        ElMessage.error('无法连接到AI分析服务');
      }
    });

    const socket = wsManager.connect();
    aiAnalysisSocket.value = socket;

    // 接收分析内容块
    socket.on('ai_analysis_chunk', (data: { content: string }) => {
      aiAnalysisContent.value += data.content;
      // 注意：这里不再直接操作 displayedAnalysisContent，而是让定时器自行追加
    });

    // 分析完成
    socket.on('ai_analysis_complete', async (data: { message: string }) => {
      stopTypingEffect(); // 停止打字效果
      aiAnalysisLoading.value = false;
      aiAnalysisCompleted.value = true;
      ElMessage.success('AI分析完成');

      // 分析完成后，重新获取回测结果以获取完整的AI分析报告
      try {
        const res = await getBacktestResult(backtestResult.value!.id);
        const resultData = res.data;
        if (resultData?.ai_analysis_report) {
          aiAnalysisContent.value = resultData.ai_analysis_report;
          displayedAnalysisContent.value = resultData.ai_analysis_report; // 确保显示完整的最终结果
        }
      } catch (error) {
        console.error('获取完整AI分析报告失败:', error);
      }

      socket.disconnect();
      aiAnalysisSocket.value = null;
    });

    // 分析错误
    socket.on('ai_analysis_error', (data: { message: string }) => {
      stopTypingEffect(); // 停止打字效果
      aiAnalysisLoading.value = false;
      aiAnalysisError.value = data.message;
      displayedAnalysisContent.value = `AI分析失败：${data.message}`; // 显示错误信息
      ElMessage.error(`AI分析失败: ${data.message}`);
      socket.disconnect();
      aiAnalysisSocket.value = null;
    });

  } catch (error: any) {
    console.error('启动AI分析失败:', error);
    stopTypingEffect(); // 停止打字效果
    aiAnalysisLoading.value = false;
    aiAnalysisError.value = error.message || '启动AI分析失败';
    displayedAnalysisContent.value = `启动AI分析失败: ${error.message}`;
    ElMessage.error(`启动AI分析失败: ${error.message}`);
  }
};

const resetAiAnalysis = () => {
  aiAnalysisContent.value = '';
  displayedAnalysisContent.value = '';
  typingIndex.value = 0;
  aiAnalysisLoading.value = false;
  aiAnalysisCompleted.value = false;
  aiAnalysisError.value = '';
  stopTypingEffect(); // 确保停止任何可能的打字效果

  // 断开WebSocket连接
  if (aiAnalysisSocket.value) {
    aiAnalysisSocket.value.disconnect();
    aiAnalysisSocket.value = null;
  }
};

// 组件卸载时清理WebSocket连接和打字效果定时器
onUnmounted(() => {
  if (aiAnalysisSocket.value) {
    aiAnalysisSocket.value.disconnect();
    aiAnalysisSocket.value = null;
  }
  stopTypingEffect();
});

// 监听回测结果变化，处理AI分析状态
watch(backtestResult, (newResult) => {
  if (newResult && newResult.status === 'completed') {
    // 检查是否有AI分析报告
    if (newResult.data?.ai_analysis_report) {
      aiAnalysisContent.value = newResult.data.ai_analysis_report;
      displayedAnalysisContent.value = newResult.data.ai_analysis_report; // 直接显示完整内容
      aiAnalysisCompleted.value = true;
      aiAnalysisLoading.value = false;
      aiAnalysisError.value = '';
      stopTypingEffect(); // 确保停止打字效果
    } else {
      // 如果没有AI分析报告，清空相关状态
      aiAnalysisContent.value = '';
      displayedAnalysisContent.value = '';
      aiAnalysisCompleted.value = false;
      aiAnalysisLoading.value = false;
      aiAnalysisError.value = '';
      stopTypingEffect(); // 确保停止打字效果
    }
  } else {
    // 当回测结果不是 completed 时，重置 AI 分析状态
    aiAnalysisContent.value = '';
    displayedAnalysisContent.value = '';
    aiAnalysisCompleted.value = false;
    aiAnalysisLoading.value = false;
    aiAnalysisError.value = '';
    stopTypingEffect();
  }
}, { deep: true });

const handleStockSelectionChange = (selectedCodes: string[]) => {
  form.stock_codes = selectedCodes;
  chartStock.value = selectedCodes[0];
};
</script>

<style scoped>
/* Backtest Container */
.backtest-container {
  @apply h-full flex flex-col overflow-hidden;
  padding: 1.5rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}

.backtest-content {
  @apply flex-1 min-h-0;
}

/* Custom Scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(168, 85, 247, 0.6) rgba(31, 41, 55, 0.3);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(168, 85, 247, 0.8), rgba(147, 51, 234, 0.8));
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(168, 85, 247, 1), rgba(147, 51, 234, 1));
}

/* Action Buttons */
.action-btn {
  @apply relative px-6 py-4 rounded-md font-semibold transition-all duration-300 border backdrop-blur-sm overflow-hidden;
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%);
  border-color: rgba(75, 85, 99, 0.3);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.action-btn-primary {
  @apply text-purple-300 hover:text-purple-200;
}

.action-btn-primary:hover {
  border-color: rgba(168, 85, 247, 0.5);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
}

/* KPI Items */
.kpi-item {
  @apply transition-all duration-300 cursor-pointer;
  backdrop-filter: blur(4px);
}

.kpi-item:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Enhanced Element Plus overrides */
:deep(.el-card) {
  background: rgba(31, 41, 55, 0.8) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
}

:deep(.el-card__header) {
  background: rgba(17, 24, 39, 0.3) !important;
  border-bottom: 1px solid rgba(75, 85, 99, 0.2) !important;
}

:deep(.el-card__body) {
  height: calc(100% - 60px) !important;
  padding: 1.5rem !important;
  overflow: hidden !important;
}

/* Form Styles */
.custom-form :deep(.el-form-item__label) {
  color: #d1d5db !important;
  font-weight: 500;
}

.custom-input :deep(.el-input__wrapper) {
  background: rgba(31, 41, 55, 0.6) !important;
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
  border-radius: 8px;
}

.custom-input :deep(.el-input__inner) {
  color: #f3f4f6 !important;
  background: transparent !important;
}

.custom-input-number :deep(.el-input-number__decrease),
.custom-input-number :deep(.el-input-number__increase) {
  background: rgba(31, 41, 55, 0.8) !important;
  border-color: rgba(75, 85, 99, 0.3) !important;
  color: #d1d5db !important;
}

.custom-input-number :deep(.el-input__wrapper) {
  background: rgba(31, 41, 55, 0.6) !important;
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
}

.custom-select :deep(.el-input__wrapper) {
  background: rgba(31, 41, 55, 0.6) !important;
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
}

.custom-select :deep(.el-input__inner) {
  color: #f3f4f6 !important;
}

.custom-date-picker :deep(.el-input__wrapper) {
  background: rgba(31, 41, 55, 0.6) !important;
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
}

.custom-date-picker :deep(.el-input__inner) {
  color: #f3f4f6 !important;
}

/* Alert Styles */
.custom-alert :deep(.el-alert__content) {
  color: #d1d5db !important;
}

.custom-alert :deep(.el-alert) {
  background: rgba(31, 41, 55, 0.6) !important;
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
}

/* Enhanced Table Styles */
.custom-table :deep(.el-table) {
  background: transparent !important;
  color: #f3f4f6 !important;
  height: 100% !important;
}

.custom-table :deep(.el-table__inner-wrapper) {
  height: 100% !important;
}

.custom-table :deep(.el-table__body-wrapper) {
  max-height: calc(100% - 48px) !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: rgba(168, 85, 247, 0.6) rgba(31, 41, 55, 0.3);
}

.custom-table :deep(.el-table__body-wrapper)::-webkit-scrollbar {
  width: 8px;
}

.custom-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.3);
  border-radius: 4px;
}

.custom-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(168, 85, 247, 0.8), rgba(147, 51, 234, 0.8));
  border-radius: 4px;
}

.custom-table :deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(168, 85, 247, 1), rgba(147, 51, 234, 1));
}

.custom-table :deep(.el-table th) {
  background: rgba(17, 24, 39, 0.6) !important;
  border-color: rgba(75, 85, 99, 0.3) !important;
  color: #d1d5db !important;
}

.custom-table :deep(.el-table td) {
  border-color: rgba(75, 85, 99, 0.2) !important;
  background: rgba(31, 41, 55, 0.3) !important;
}

.custom-table :deep(.el-table__row:hover) {
  background: rgba(55, 65, 81, 0.5) !important;
}

/* Tag Styles */
.custom-tag :deep(.el-tag) {
  backdrop-filter: blur(4px) !important;
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
}

/* Tabs Styles */
.custom-tabs :deep(.el-tabs__header) {
  border-bottom: 1px solid rgba(75, 85, 99, 0.3) !important;
}

.custom-tabs :deep(.el-tabs__nav-wrap::after) {
  background: rgba(75, 85, 99, 0.3) !important;
}

.custom-tabs :deep(.el-tabs__item) {
  color: #9ca3af !important;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  color: #a855f7 !important;
}

.custom-tabs :deep(.el-tabs__active-bar) {
  background: #a855f7 !important;
}

/* Progress Styles */
:deep(.el-progress-circle__track) {
  stroke: rgba(75, 85, 99, 0.3) !important;
}

:deep(.el-progress-circle__path) {
  stroke: #a855f7 !important;
}

:deep(.el-progress__text) {
  color: #f3f4f6 !important;
}

/* Tooltip Styles */
:deep(.el-tooltip__trigger) {
  color: #9ca3af !important;
}

/* Loading animations */
@keyframes pulse {
0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from {
      transform: rotate(0deg);
    }
  
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  /* Change Colors */
  .text-red-500 {
    color: #ef4444 !important;
  }
  
  .text-green-500 {
    color: #22c55e !important;
  }
  
  /* Hover effects */
  .transition-all {
    transition: all 0.3s ease;
  }
  
  /* Enhanced scrollbar for dropdown */
  :deep(.el-select-dropdown) {
    background: rgba(31, 41, 55, 0.95) !important;
    border: 1px solid rgba(75, 85, 99, 0.3) !important;
    backdrop-filter: blur(10px);
  }
  
  :deep(.el-select-dropdown__item) {
    color: #f3f4f6 !important;
  }
  
  :deep(.el-select-dropdown__item:hover) {
    background: rgba(55, 65, 81, 0.5) !important;
  }
  
  :deep(.el-select-dropdown__item.selected) {
    background: rgba(168, 85, 247, 0.2) !important;
    color: #e9d5ff !important;
  }
                                /* AI 分析模块样式 */
                                .ai-analysis-container {
                                  @apply h-full overflow-y-auto custom-scrollbar;
                                }
                
                                .ai-content-area {
                                  @apply min-h-[400px];
                                }
                
                                .ai-analysis-result {
                                  @apply p-6 rounded-md bg-gray-800/50 border border-gray-700/30;
                                }
                
                                /* v-md-editor 样式定制 */
                                :deep(.v-md-editor) {
                                  background: transparent !important;
                                  border: none !important;
                                }
                
                                :deep(.v-md-editor-preview) {
                                  background: transparent !important;
                                  color: #e5e7eb !important;
                                  font-size: 0.95rem;
                                  line-height: 1.6;
                                  padding: 0 !important;
                                }
                
                                :deep(.v-md-editor-preview-content) {
                                  background: transparent !important;
                                }
                
                                /* 标题样式 */
                                :deep(.v-md-editor-preview h1),
                                :deep(.v-md-editor-preview h2),
                                :deep(.v-md-editor-preview h3),
                                :deep(.v-md-editor-preview h4),
                                :deep(.v-md-editor-preview h5),
                                :deep(.v-md-editor-preview h6) {
                                  color: #a5b4fc !important;
                                  font-weight: 700;
                                  margin-top: 1.5rem;
                                  margin-bottom: 0.75rem;
                                  line-height: 1.3;
                                }
                
                                :deep(.v-md-editor-preview h1) {
                                  font-size: 1.75rem;
                                  border-bottom: 2px solid rgba(165, 180, 252, 0.3);
                                  padding-bottom: 0.5rem;
                                }
                
                                :deep(.v-md-editor-preview h2) {
                                  font-size: 1.5rem;
                                  border-bottom: 1px solid rgba(165, 180, 252, 0.2);
                                  padding-bottom: 0.25rem;
                                }
                
                                :deep(.v-md-editor-preview h3) {
                                  font-size: 1.25rem;
                                }
                
                                :deep(.v-md-editor-preview h4) {
                                  font-size: 1.125rem;
                                }
                
                                /* 段落和文本 */
                                :deep(.v-md-editor-preview p) {
                                  margin-bottom: 1rem;
                                  color: #d1d5db !important;
                                  line-height: 1.6;
                                }
                
                                /* 表格样式 */
                                :deep(.v-md-editor-preview table) {
                                  background: rgba(31, 41, 55, 0.6) !important;
                                  border-radius: 0.5rem;
                                  overflow: hidden;
                                  border-collapse: separate;
                                  border-spacing: 0;
                                  margin: 1.5rem 0;
                                  border: 1px solid rgba(75, 85, 99, 0.3) !important;
                                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                                }
                
                                :deep(.v-md-editor-preview th) {
                                  background: rgba(55, 65, 81, 0.8) !important;
                                  color: #f3f4f6 !important;
                                  font-weight: 600;
                                  border-bottom: 1px solid rgba(75, 85, 99, 0.5) !important;
                                  padding: 0.75rem 1rem;
                                  text-align: left;
                                }
                
                                :deep(.v-md-editor-preview td) {
                                  border-bottom: 1px solid rgba(75, 85, 99, 0.2) !important;
                                  padding: 0.75rem 1rem;
                                  color: #d1d5db !important;
                                }
                
                                :deep(.v-md-editor-preview tr:hover) {
                                  background: rgba(55, 65, 81, 0.3) !important;
                                }
                
                                /* 代码块样式 */
                                :deep(.v-md-editor-preview pre) {
                                  background: #1e293b !important;
                                  border-radius: 0.5rem;
                                  padding: 1rem;
                                  color: #e2e8f0;
                                  font-size: 0.875rem;
                                  margin: 1.5rem 0;
                                  border: 1px solid rgba(75, 85, 99, 0.3) !important;
                                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                                  overflow-x: auto;
                                }
                
                                :deep(.v-md-editor-preview code) {
                                  background: rgba(55, 65, 81, 0.5) !important;
                                  color: #fbbf24 !important;
                                  padding: 0.125rem 0.25rem;
                                  border-radius: 0.25rem;
                                  font-size: 0.875em;
                                  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                                }
                
                                :deep(.v-md-editor-preview pre code) {
                                  background: transparent !important;
                                  color: inherit !important;
                                  padding: 0;
                                  border-radius: 0;
                                }
                
                                /* 引用块 */
                                :deep(.v-md-editor-preview blockquote) {
                                  background: rgba(59, 130, 246, 0.08) !important;
                                  border-left: 4px solid #60a5fa !important;
                                  color: #bae6fd !important;
                                  border-radius: 0.5rem;
                                  padding: 1rem 1.25rem;
                                  margin: 1.5rem 0;
                                  font-style: italic;
                                }
                
                                /* 列表样式 */
                                :deep(.v-md-editor-preview ul),
                                :deep(.v-md-editor-preview ol) {
                                  margin-left: 1.5rem;
                                  margin-bottom: 1rem;
                                  color: #d1d5db !important;
                                }
                
                                :deep(.v-md-editor-preview li) {
                                  margin-bottom: 0.5rem;
                                  line-height: 1.6;
                                }
                
                                :deep(.v-md-editor-preview ul li) {
                                  list-style-type: disc;
                                }
                
                                :deep(.v-md-editor-preview ol li) {
                                  list-style-type: decimal;
                                }
                
                                /* 强调和加粗 */
                                :deep(.v-md-editor-preview strong) {
                                  color: #fbbf24 !important;
                                  font-weight: 700;
                                }
                
                                :deep(.v-md-editor-preview em) {
                                  color: #f472b6 !important;
                                  font-style: italic;
                                }
                
                                /* 链接 */
                                :deep(.v-md-editor-preview a) {
                                  color: #60a5fa !important;
                                  text-decoration: none;
                                  border-bottom: 1px solid rgba(96, 165, 250, 0.3);
                                  transition: all 0.2s ease;
                                }
                
                                :deep(.v-md-editor-preview a:hover) {
                                  color: #93c5fd !important;
                                  border-bottom-color: rgba(147, 197, 253, 0.6);
                                }
                
                                /* 水平分割线 */
                                :deep(.v-md-editor-preview hr) {
                                  border: none;
                                  height: 1px;
                                  background: linear-gradient(90deg, transparent, rgba(75, 85, 99, 0.5), transparent);
                                  margin: 2rem 0;
                                }
                
                                /* 图片 */
                                :deep(.v-md-editor-preview img) {
                                  border-radius: 0.5rem;
                                  max-width: 100%;
                                  height: auto;
                                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                                }
                
                                /* 表格样式 */
                                :deep(.v-md-editor-preview table) {
                                  width: 100%;
                                  background: rgba(31, 41, 55, 0.7) !important;
                                  border-radius: 0.75rem !important;
                                  border-collapse: separate !important;
                                  border-spacing: 0 !important;
                                  margin: 1.5rem 0;
                                  border: 1px solid rgba(75, 85, 99, 0.3) !important;
                                  box-shadow: 0 4px 16px 0 rgba(16, 24, 40, 0.10);
                                  overflow: hidden;
                                }
                
                                :deep(.v-md-editor-preview th) {
                                  background: rgba(55, 65, 81, 0.95) !important;
                                  color: #f3f4f6 !important;
                                  font-weight: 700 !important;
                                  border-bottom: 1px solid rgba(75, 85, 99, 0.5) !important;
                                  padding: 0.85rem 1.2rem !important;
                                  text-align: left;
                                  font-size: 1rem;
                                }
                
                                :deep(.v-md-editor-preview td) {
                                  background: transparent !important;
                                  border-bottom: 1px solid rgba(75, 85, 99, 0.2) !important;
                                  padding: 0.85rem 1.2rem !important;
                                  color: #e5e7eb !important;
                                  font-size: 1rem;
                                }
                
                                :deep(.v-md-editor-preview tr:last-child td) {
                                  border-bottom: none !important;
                                }
                
                                :deep(.v-md-editor-preview tr) {
                                  background: rgba(55, 65, 81, 0.3) !important;
                                }
                
                                /* 适配深色滚动条 */
                                :deep(.v-md-editor-preview)::-webkit-scrollbar {
                                  width: 6px;
                                  background: rgba(31, 41, 55, 0.3);
                                }
                
                                :deep(.v-md-editor-preview)::-webkit-scrollbar-thumb {
                                  background: linear-gradient(180deg, rgba(168, 85, 247, 0.8), rgba(147, 51, 234, 0.8));
                                  border-radius: 3px;
                                }
                
                                :deep(.v-md-editor-preview)::-webkit-scrollbar-thumb:hover {
                                  background: linear-gradient(180deg, rgba(168, 85, 247, 1), rgba(147, 51, 234, 1));
                                }
                
                                .action-btn-secondary {
                                  @apply text-gray-300 hover:text-gray-200;
                                }
                
                                .action-btn-secondary:hover {
                                  border-color: rgba(75, 85, 99, 0.5);
                                  background: linear-gradient(135deg, rgba(75, 85, 99, 0.1) 0%, rgba(55, 65, 81, 0.1) 100%);
                                }
                
                                /* 打字机光标样式 */
                                .typing-cursor {
                                  @apply inline-block w-0.5 h-6 bg-blue-400 ml-1;
                                  animation: blink 1s infinite;
                                }
                
                                @keyframes blink {
                
                                  0%,
                                  50% {
                                    opacity: 1;
                                  }
                
                                  51%,
                                  100% {
                                    opacity: 0;
                                  }
                                }
</style>