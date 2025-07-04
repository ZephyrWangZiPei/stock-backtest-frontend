<template>
  <div class="scheduler-container">
    <!-- Scheduler status header (controls) -->
    <div class="scheduler-controls mb-6">
      <div class="relative">
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-lg blur-xl"></div>
        <div class="relative bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-lg px-6 py-4 flex justify-between items-center">
          <el-tag 
            :type="schedulerStatus.is_running ? 'success' : 'info'" 
            size="large" 
            class="relative px-6 py-2 text-base font-semibold backdrop-blur-sm"
            :class="schedulerStatus.is_running ? 'animate-pulse' : ''"
          >
            <div class="flex items-center space-x-2">
              <div :class="schedulerStatus.is_running ? 'w-2 h-2 bg-green-400 rounded-md animate-pulse' : 'w-2 h-2 bg-gray-400 rounded-md'"></div>
              <span>{{ schedulerStatus.is_running ? '运行中' : '已停止' }}</span>
            </div>
          </el-tag>
        </div>
      </div>
    </div>

    <div class="scheduler-content">
      <el-row :gutter="24" class="h-full">
        <!-- Left Column - Enhanced Control Panel -->
        <el-col :span="8" class="h-full">
          <div class="flex flex-col h-full space-y-4">
            <!-- Merged Control & Status Card -->
            <div class="relative group flex-1">
              <div class="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <el-card class="relative h-full border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                <template #header>
                  <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-3">
                      <div class="w-2 h-2 bg-blue-400 rounded-md animate-pulse"></div>
                      <span class="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">控制与状态</span>
                    </div>
                  </div>
                </template>
                
                <div class="h-full flex flex-col">
                  <!-- Quick Actions Section -->
                  <div class="mb-6">
                    <h3 class="text-lg font-semibold mb-4 text-gray-200 flex items-center">
                      <div class="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-400 rounded-md mr-3"></div>
                      快捷操作
                    </h3>
                    <div class="grid grid-cols-1 gap-3">
                      <button 
                        @click="handleManualUpdateDailyData" 
                        :disabled="loading.dailyData"
                        class="action-button action-button-primary group"
                      >
                        <div class="flex items-center justify-center space-x-3">
                          <div class="w-10 h-10 bg-blue-500/20 rounded-sm flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                            <div class="w-5 h-5 bg-blue-400 rounded-xs"></div>
                          </div>
                          <span class="font-medium">
                            {{ loading.dailyData ? '更新中...' : '更新当日数据' }}
                          </span>
                        </div>
                        <div v-if="loading.dailyData" class="absolute inset-0 bg-blue-500/10 rounded-md animate-pulse"></div>
                      </button>
                      
                      <button 
                        @click="handleManualUpdateStockList" 
                        :disabled="loading.stockList"
                        class="action-button action-button-success group"
                      >
                        <div class="flex items-center justify-center space-x-3">
                          <div class="w-10 h-10 bg-green-500/20 rounded-sm flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                            <div class="w-5 h-5 bg-green-400 rounded-xs"></div>
                          </div>
                          <span class="font-medium">
                            {{ loading.stockList ? '更新中...' : '更新股票列表' }}
                          </span>
                        </div>
                        <div v-if="loading.stockList" class="absolute inset-0 bg-green-500/10 rounded-md animate-pulse"></div>
                      </button>
                    </div>
                  </div>

                  <div class="relative flex-1">
                    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                    <div class="pt-6 h-full">
                      <!-- Update Progress Section -->
                      <h3 class="text-lg font-semibold mb-4 text-gray-200 flex items-center">
                        <div class="w-1 h-6 bg-gradient-to-b from-green-400 to-teal-400 rounded-md mr-3"></div>
                        更新进度
                      </h3>
                      <div class="space-y-4 overflow-y-auto max-h-64 custom-scrollbar">
                        <!-- Daily Data Progress -->
                        <div class="progress-item">
                          <div class="flex justify-between items-center mb-3">
                            <div>
                              <span class="text-white font-medium">当日数据更新</span>
                              <div v-if="lastUpdateTimes?.daily_data" class="text-xs text-gray-400 mt-1">
                                上次更新: {{ formatDateTime(lastUpdateTimes.daily_data) }}
                              </div>
                            </div>
                            <span class="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-md">
                              {{ dailyUpdateTask?.message || '等待任务' }}
                            </span>
                          </div>
                          <div class="custom-progress">
                            <div class="progress-bg">
                              <div 
                                class="progress-fill progress-fill-blue" 
                                :style="{ width: `${dailyUpdateTask?.current_date_progress || 0}%` }"
                                :class="dailyUpdateTask?.success === false ? 'progress-fill-error' : ''"
                              ></div>
                            </div>
                            <span class="progress-text">{{ dailyUpdateTask?.current_date_progress || 0 }}%</span>
                          </div>
                        </div>
                        
                        <!-- Stock List Progress -->
                        <div class="progress-item">
                          <div class="flex justify-between items-center mb-3">
                            <div>
                              <span class="text-white font-medium">股票列表更新</span>
                              <div v-if="lastUpdateTimes?.stock_list" class="text-xs text-gray-400 mt-1">
                                上次更新: {{ formatDateTime(lastUpdateTimes.stock_list) }}
                              </div>
                            </div>
                            <span class="text-xs text-gray-400 bg-gray-700/50 px-3 py-1 rounded-md">
                              {{ stockListUpdateTask?.message || '等待任务' }}
                            </span>
                          </div>
                          <div class="custom-progress">
                            <div class="progress-bg">
                              <div 
                                class="progress-fill progress-fill-green" 
                                :style="{ width: `${stockListUpdateTask?.progress || 0}%` }"
                                :class="stockListUpdateTask?.success === false ? 'progress-fill-error' : ''"
                              ></div>
                            </div>
                            <span class="progress-text">{{ stockListUpdateTask?.progress || 0 }}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>

            <!-- Enhanced Sea Selection Card -->
            <div class="relative group">
              <div class="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
              <el-card class="relative border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <template #header>
                  <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-3">
                      <div class="w-2 h-2 bg-purple-400 rounded-md animate-pulse"></div>
                      <span class="font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">潜力股票海选</span>
                    </div>
                  </div>
                </template>
                
                <div class="job-runner">
                  <div class="mb-4">
                    <div class="flex items-start space-x-3">
                      <div class="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-sm flex items-center justify-center flex-shrink-0 mt-1">
                        <div class="w-6 h-6 bg-purple-400 rounded-sm"></div>
                      </div>
                      <div>
                        <p class="text-gray-300 leading-relaxed text-sm">
                          扫描全市场股票，基于预设模型（如准金叉）筛选出有潜力的股票池，为"策略推荐"提供数据源。
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    @click="startSeaSelectionJob" 
                    :disabled="candidatePoolTask.isRunning"
                    class="action-button action-button-purple w-full group mb-4"
                  >
                    <div class="flex items-center justify-center space-x-3">
                      <div class="w-10 h-10 bg-purple-500/20 rounded-sm flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                        <div class="w-5 h-5 bg-purple-400 rounded-xs" :class="candidatePoolTask.isRunning ? 'animate-spin' : ''"></div>
                      </div>
                      <span class="font-medium">
                        {{ candidatePoolTask.isRunning ? '正在执行...' : '手动执行海选' }}
                      </span>
                    </div>
                    <div v-if="candidatePoolTask.isRunning" class="absolute inset-0 bg-purple-500/10 rounded-md animate-pulse"></div>
                  </button>
                  
                  <div v-if="candidatePoolTask.message" class="job-progress">
                    <div class="custom-progress mb-4">
                      <div class="progress-bg">
                        <div 
                          class="progress-fill progress-fill-purple" 
                          :style="{ width: `${candidatePoolTask.current_date_progress}%` }"
                          :class="candidatePoolTask.success === false ? 'progress-fill-error' : (candidatePoolTask.success === true ? 'progress-fill-success' : '')"
                        ></div>
                      </div>
                      <span class="progress-text">{{ candidatePoolTask.current_date_progress }}%</span>
                    </div>
                    <p class="text-center text-sm text-gray-300 bg-gray-700/30 px-4 py-2 rounded-sm">
                      {{ candidatePoolTask.message }}
                    </p>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-col>

        <!-- Right Column - Enhanced Task List -->
        <el-col :span="16" class="h-full">
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
            <el-card class="relative border border-gray-700/50 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
              <template #header>
                <div class="flex justify-between items-center">
                  <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 bg-indigo-400 rounded-md animate-pulse"></div>
                    <span class="font-bold text-xl bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">任务列表</span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <button 
                      @click="handleRequestStatusUpdate" 
                      class="text-button text-button-primary"
                    >
                      <div class="flex items-center space-x-2">
                        <div class="w-4 h-4 bg-indigo-400 rounded-xs"></div>
                        <span>刷新状态</span>
                      </div>
                    </button>
                    <button 
                      @click="handleResetJobs" 
                      :disabled="loading.reset"
                      class="text-button text-button-danger"
                    >
                      <div class="flex items-center space-x-2">
                        <div class="w-4 h-4 bg-red-400 rounded-xs" :class="loading.reset ? 'animate-spin' : ''"></div>
                        <span>{{ loading.reset ? '重置中...' : '重置所有任务' }}</span>
                      </div>
                    </button>
                  </div>
                </div>
              </template>
              
              <div class="custom-table-container">
                <el-table 
                  :data="schedulerStatus.jobs" 
                  v-loading="tableLoading" 
                  element-loading-text="连接实时服务中..." 
                  class="custom-table"
                  :loading="tableLoading"
                >
                  <template #empty>
                    <div class="empty-state">
                      <div class="w-16 h-16 bg-gray-700/50 rounded-md flex items-center justify-center mb-4">
                        <div class="w-8 h-8 border-2 border-gray-600 rounded-md"></div>
                      </div>
                      <p class="text-lg font-medium text-gray-300 mb-2">暂无任务</p>
                      <p class="text-sm text-gray-400 mb-1">如果系统刚启动，请稍等片刻或点击右上角刷新状态。</p>
                      <p class="text-sm text-gray-400">您也可以重置所有任务为默认设置。</p>
                    </div>
                  </template>
                  
                  <el-table-column prop="name" label="任务名称" min-width="200">
                    <template #default="{ row }">
                      <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-sm flex items-center justify-center">
                          <div class="w-3 h-3 bg-indigo-400 rounded-xs"></div>
                        </div>
                        <span class="font-medium text-white">{{ row.name }}</span>
                      </div>
                    </template>
                  </el-table-column>
                  
                  <el-table-column prop="next_run_time" label="下次运行时间" width="200">
                    <template #default="{ row }">
                      <div class="text-gray-300 bg-gray-700/30 px-3 py-1 rounded-md text-sm">
                        {{ formatDateTime(row.next_run_time) }}
                      </div>
                    </template>
                  </el-table-column>
                  
                  <el-table-column prop="trigger" label="触发器" min-width="150">
                    <template #default="{ row }">
                      <span class="text-gray-300 bg-gray-700/30 px-3 py-1 rounded-md text-sm">
                        {{ row.trigger }}
                      </span>
                    </template>
                  </el-table-column>
                  
                  <el-table-column label="操作" width="160">
                    <template #default="{ row }">
                      <div class="flex items-center space-x-2">
                        <button @click="handleEdit(row)" class="table-action-btn table-action-edit">
                          编辑
                        </button>
                        <button 
                          @click="handleDelete(row.id)" 
                          :disabled="loading.delete === row.id"
                          class="table-action-btn table-action-delete"
                        >
                          {{ loading.delete === row.id ? '删除中...' : '删除' }}
                        </button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- Enhanced Edit Dialog -->
    <el-dialog v-model="dialogVisible" title="编辑任务" width="500px" class="custom-dialog">
      <el-form :model="editForm" label-width="100px" class="custom-form">
        <el-form-item label="任务ID">
          <el-input v-model="editForm.id" disabled class="custom-input" />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="editForm.name" disabled class="custom-input" />
        </el-form-item>
        <el-form-item label="触发类型">
          <el-select v-model="editForm.trigger.type" @change="handleTriggerTypeChange" class="custom-select w-full">
            <el-option label="Cron" value="cron" />
            <el-option label="Interval" value="interval" />
          </el-select>
        </el-form-item>
        <div v-if="editForm.trigger.type === 'cron'" class="space-y-4">
          <el-form-item label="星期">
            <el-input v-model="editForm.trigger.day_of_week" placeholder="例如: mon-fri, sat" class="custom-input" />
          </el-form-item>
          <el-form-item label="小时">
            <el-input v-model="editForm.trigger.hour" placeholder="0-23" class="custom-input" />
          </el-form-item>
          <el-form-item label="分钟">
            <el-input v-model="editForm.trigger.minute" placeholder="0-59" class="custom-input" />
          </el-form-item>
        </div>
        <div v-if="editForm.trigger.type === 'interval'">
          <el-form-item label="秒数">
            <el-input v-model="editForm.trigger.seconds" type="number" min="1" class="custom-input" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <button @click="dialogVisible = false" class="dialog-button dialog-button-cancel">
            取消
          </button>
          <button @click="handleSave" :disabled="loading.save" class="dialog-button dialog-button-save">
            {{ loading.save ? '保存中...' : '保存' }}
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, onUnmounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useSchedulerStore } from '@/store/scheduler';
import {
  rescheduleJob,
  deleteJob,
  runJob,
} from '@/utils/api';

// --- Type Definition ---
interface SchedulerStatus {
  is_running: boolean;
  jobs_count: number;
  jobs: any[];
  current_time: string;
}

const store = useSchedulerStore();

// --- Formatting ---
const formatDateTime = (isoString: string | null | undefined) => {
  if (!isoString) return 'N/A';
  // Check if it's already in a user-friendly format (e.g., from scheduler's next_run_time which might not be ISO)
  // This is a simple check and can be improved.
  if (!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(isoString)) {
      return isoString;
  }
  try {
    const date = new Date(isoString.replace(' ', 'T'));
    if (isNaN(date.getTime())) return isoString; // Return original string if it's not a valid date
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  } catch (e) {
    return isoString; // return original if failed to parse
  }
};

// --- Reactive State & Loaders ---
const loading = reactive({
  dailyData: false,
  stockList: false,
  reset: false,
  save: false,
  delete: null as string | null,
});
const dialogVisible = ref(false);
const editForm = ref<any>({ trigger: {} });
const jobStatus = ref({
  isRunning: false,
  progress: 0,
  message: '尚未开始'
});

// --- Computed Properties from Pinia Store ---
const schedulerStatus = computed<SchedulerStatus>(() => store.status);
const dailyUpdateTask = computed<any>(() => {
  const task = store.taskStatus['update_daily_data'];
  if (!task) return { isRunning: false, current_date_progress: 0, message: '等待任务启动...', success: undefined };
  return {
    isRunning: task.success === undefined,
    current_date_progress: task.current_date_progress || 0,
    message: task.message || (task.success === undefined ? '正在执行...' : '已完成'),
    success: task.success
  };
});
const stockListUpdateTask = computed(() => {
  const task = store.taskStatus['update_stock_list'];
  if (!task) return { isRunning: false, progress: 0, message: '等待任务启动...', success: undefined };
  return {
    isRunning: task.success === undefined,
    progress: task.progress || 0,
    message: task.message || (task.success === undefined ? '正在执行...' : '已完成'),
    success: task.success
  };
});
const candidatePoolTask = computed(() => {
  const task = store.taskStatus['candidate_pool'];
  if (!task) return { isRunning: false, current_date_progress: 0, message: '等待任务启动...', success: undefined };
  
  // 'success' being undefined means it's running. True/false means completed/failed.
  const isRunning = task.success === undefined; 
  
  return {
    isRunning,
    current_date_progress: task.current_date_progress || 0,
    message: task.message || (isRunning ? '正在执行...' : '已完成'),
    success: task.success
  };
});
const tableLoading = computed(() => !store.isConnected);
const lastUpdateTimes = computed(() => store.last_update_times);

// --- WebSocket Connection ---
onMounted(() => {
  if (!store.isConnected) {
    store.connect();
  } else {
    store.requestStatusUpdate();
  }

  // 监听海选任务状态
  if (store.socket) {
    store.socket.on('job_status', handleJobStatus);
    store.socket.on('job_progress', handleJobProgress);
  } else {
    // 如果socket尚未连接，则等待连接成功后再监听
    const unwatch = watch(() => store.socket, (newSocket: any) => {
      if (newSocket) {
        newSocket.on('job_status', handleJobStatus);
        newSocket.on('job_progress', handleJobProgress);
        unwatch(); // 停止监听
      }
    });
  }
});

onUnmounted(() => {
  if (store.socket) {
    store.socket.off('job_status', handleJobStatus);
    store.socket.off('job_progress', handleJobProgress);
  }
});

// --- User Actions ---

const handleRequestStatusUpdate = () => {
  store.requestStatusUpdate();
};

const handleManualUpdate = (
  taskEvent: 'manual_update_daily_data' | 'manual_update_stock_list',
  loadingKey: 'dailyData' | 'stockList',
  taskName: string
) => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。');
    return;
  }
  loading[loadingKey] = true;
  // Reset previous task status
  store.taskStatus[`update_${taskName}`] = { current_date_progress: 0, message: '请求已发送...', success: undefined };
  store.socket.emit(taskEvent, {});
  ElMessage.info(`已发送 ${taskName === 'daily_data' ? '当日数据' : '股票列表'} 更新请求`);
  
  // The loading state will be properly managed by listening to 'update_complete' or 'update_error' events.
  // We can set a timeout to reset the button loading state as a fallback.
  setTimeout(() => {
    loading[loadingKey] = false;
  }, 30000); // 30 second timeout as a fallback
};

const handleManualUpdateDailyData = () => handleManualUpdate('manual_update_daily_data', 'dailyData', 'daily_data');
const handleManualUpdateStockList = () => handleManualUpdate('manual_update_stock_list', 'stockList', 'stock_list');

const handleResetJobs = () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法重置任务。');
    return;
  }
  
  ElMessageBox.confirm('确定要重置所有任务到默认设置吗？此操作不可逆。', '警告', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    loading.reset = true;
    store.socket?.emit('setup_jobs', {});
    ElMessage.info('已发送重置任务请求');
    
    // Fallback to reset loading state
    setTimeout(() => {
      loading.reset = false;
    }, 10000);
  });
};

const handleEdit = (job: any) => {
  const jobCopy = JSON.parse(JSON.stringify(job));
  
  const parseTrigger = (triggerStr: string) => {
    const triggerData: { type: 'cron' | 'interval', [key: string]: any } = { type: 'cron' };
    if (triggerStr.includes("CronTrigger")) {
        triggerData.type = 'cron';
        const fields = triggerStr.match(/\[(.*)\]/)?.[1].split(', ');
        fields?.forEach(field => {
            const [key, value] = field.split('=');
            if (key && value) {
                triggerData[key.trim()] = value.replace(/'/g, "");
            }
        });
    } else if (triggerStr.includes("IntervalTrigger")) {
        triggerData.type = 'interval';
        const seconds = triggerStr.match(/seconds=(\d+)/)?.[1];
        if (seconds) {
            triggerData.seconds = parseInt(seconds, 10);
        }
    }
    return triggerData;
  }

  jobCopy.trigger = parseTrigger(job.trigger);
  editForm.value = jobCopy;
  dialogVisible.value = true;
};


const handleSave = async () => {
  loading.save = true;
  try {
    const { id, trigger } = editForm.value;
    await rescheduleJob(id, { trigger });
    ElMessage.success('任务更新成功');
    dialogVisible.value = false;
    store.requestStatusUpdate();
  } catch (error) {
    ElMessage.error('任务更新失败');
  } finally {
    loading.save = false;
  }
};

const handleDelete = (jobId: string) => {
  ElMessageBox.confirm('确定要删除这个任务吗?', '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.delete = jobId;
    try {
      await deleteJob(jobId);
      ElMessage.success('任务删除成功');
      store.requestStatusUpdate();
    } catch (error) {
      ElMessage.error('任务删除失败');
    } finally {
      loading.delete = null;
    }
  })
};

const handleTriggerTypeChange = () => {
  const currentType = editForm.value.trigger.type;
  if (currentType === 'cron') {
    editForm.value.trigger = {
      type: 'cron',
      day_of_week: 'mon-fri',
      hour: '18',
      minute: '0',
    };
  } else {
    editForm.value.trigger = {
      type: 'interval',
      seconds: 3600
    };
  }
};

const startSeaSelectionJob = async () => {
  if (!store.socket?.connected) {
    ElMessage.error('实时服务未连接，无法启动任务。');
    return;
  }
  
  // 使用WebSocket来触发任务
  store.socket.emit('run_job_manually', { job_id: 'candidate_pool' });
  ElMessage.info('已发送海选任务启动请求...');

  // UI状态的更新将完全由WebSocket推送的 'job_status' 和 'job_progress' 事件来驱动
  // 因此，不再需要在这里手动管理 'jobStatus' 的状态
};

const handleJobStatus = (data: any) => {
  if (data.job_name === 'candidate_pool') {
    jobStatus.value.message = data.message;
    if (data.status === 'started') {
      jobStatus.value.isRunning = true;
      jobStatus.value.progress = 0;
    } else if (data.status === 'completed' || data.status === 'failed') {
      jobStatus.value.isRunning = false;
    }
  }
};

const handleJobProgress = (data: any) => {
  if (data.job_name === 'candidate_pool') {
    jobStatus.value.isRunning = true;
    const percentage = data.total > 0 ? Math.round((data.progress / data.total) * 100) : 0;
    jobStatus.value.progress = percentage;
    jobStatus.value.message = data.message;
  }
};
</script>

<style scoped>
/* Scheduler Container */
.scheduler-container {
  @apply h-full flex flex-col overflow-hidden;
  padding: 1.5rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
}

.scheduler-content {
  @apply flex-1 min-h-0;
}

/* Custom Scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.6) rgba(31, 41, 55, 0.3);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(99, 102, 241, 1), rgba(139, 92, 246, 1));
}

/* Action Buttons */
.action-button {
  @apply relative px-6 py-4 rounded-xl font-semibold transition-all duration-300 border backdrop-blur-sm overflow-hidden;
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.8) 100%);
  border-color: rgba(75, 85, 99, 0.3);
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.action-button-primary:hover { border-color: rgba(59, 130, 246, 0.5); }
.action-button-success:hover { border-color: rgba(34, 197, 94, 0.5); }
.action-button-purple:hover { border-color: rgba(168, 85, 247, 0.5); }

/* Text Buttons */
.text-button {
  @apply px-4 py-2 rounded-md transition-all duration-200 text-sm font-medium border border-transparent;
}

.text-button-primary {
  @apply text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10 hover:border-indigo-500/20;
}

.text-button-danger {
  @apply text-red-300 hover:text-red-200 hover:bg-red-500/10 hover:border-red-500/20;
}

/* Custom Progress Bars */
.progress-item {
  @apply p-4 rounded-lg border transition-all duration-300;
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.6) 100%);
  border-color: rgba(75, 85, 99, 0.2);
}

.custom-progress {
  @apply relative flex items-center;
}

.progress-bg {
  @apply flex-1 h-3 bg-gray-700/50 rounded-lg overflow-hidden mr-3;
}

.progress-fill {
  @apply h-full rounded-lg transition-all duration-500 ease-out;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.8) 0%, rgba(99, 102, 241, 0.8) 100%);
}

.progress-fill-blue {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.8) 0%, rgba(99, 102, 241, 0.8) 100%);
}

.progress-fill-green {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.8) 100%);
}

.progress-fill-purple {
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.8) 0%, rgba(147, 51, 234, 0.8) 100%);
}

.progress-fill-error {
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.8) 0%, rgba(220, 38, 38, 0.8) 100%);
}

.progress-fill-success {
  background: linear-gradient(90deg, rgba(34, 197, 94, 0.8) 0%, rgba(16, 185, 129, 0.8) 100%);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
}

.progress-text {
  @apply text-sm font-medium text-gray-300 min-w-12 text-right;
}

/* Enhanced Custom Table */
.custom-table-container {
  @apply rounded-xl overflow-hidden flex-1 min-h-0;
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.3) 0%, rgba(17, 24, 39, 0.3) 100%);
}

.empty-state {
  @apply flex flex-col items-center justify-center py-12 text-gray-400;
}

.table-action-btn {
  @apply px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 border;
}

.table-action-edit {
  @apply text-blue-300 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40;
}

.table-action-delete {
  @apply text-red-300 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40;
}

.table-action-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Dialog Styling */
.dialog-button {
  @apply px-6 py-2 rounded-md font-medium transition-all duration-200 border;
}

.dialog-button-cancel {
  @apply text-gray-300 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500;
}

.dialog-button-save {
  @apply text-white bg-gradient-to-r from-blue-500 to-purple-500 border-transparent hover:from-blue-600 hover:to-purple-600;
}

.dialog-button-save:disabled {
  @apply opacity-50 cursor-not-allowed;
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

:deep(.el-table) {
  background: transparent !important;
  color: #f3f4f6 !important;
  height: 100% !important;
}

:deep(.el-table__inner-wrapper) {
  height: 100% !important;
}

:deep(.el-table__body-wrapper) {
  max-height: calc(100% - 48px) !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.6) rgba(31, 41, 55, 0.3);
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar {
  width: 8px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-track {
  background: rgba(31, 41, 55, 0.3);
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
  border-radius: 4px;
}

:deep(.el-table__body-wrapper)::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(99, 102, 241, 1), rgba(139, 92, 246, 1));
}

:deep(.el-table th) {
  background: rgba(17, 24, 39, 0.6) !important;
  border-color: rgba(75, 85, 99, 0.3) !important;
  color: #d1d5db !important;
}

:deep(.el-table td) {
  border-color: rgba(75, 85, 99, 0.2) !important;
  background: rgba(31, 41, 55, 0.3) !important;
}

:deep(.el-table__row:hover) {
  background: rgba(55, 65, 81, 0.5) !important;
}

:deep(.el-dialog) {
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(75, 85, 99, 0.3);
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(75, 85, 99, 0.3);
  padding: 20px 24px 16px;
}

:deep(.el-dialog__title) {
  color: #f3f4f6 !important;
  font-weight: 600;
}

:deep(.el-form-item__label) {
  color: #d1d5db !important;
}

:deep(.el-input__wrapper) {
  background: rgba(31, 41, 55, 0.6) !important;
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
  border-radius: 8px;
}

:deep(.el-input__inner) {
  color: #f3f4f6 !important;
  background: transparent !important;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(31, 41, 55, 0.6) !important;
}

:deep(.el-tag) {
  backdrop-filter: blur(4px) !important;
  border: 1px solid rgba(75, 85, 99, 0.3) !important;
}

/* Loading animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>