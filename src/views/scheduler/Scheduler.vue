<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-white">任务调度中心</h1>
      <el-tag :type="schedulerStatus.is_running ? 'success' : 'info'" size="large">
        {{ schedulerStatus.is_running ? '运行中' : '已停止' }}
      </el-tag>
    </div>

    <el-row :gutter="20">
      <!-- Left Column -->
      <el-col :span="8">
        <!-- Merged Control & Status Card -->
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span>控制与状态</span>
            </div>
          </template>
          
          <!-- Quick Actions Section -->
          <div class="mb-6">
            <h3 class="text-md font-semibold mb-3 text-gray-300">快捷操作</h3>
            <div class="grid grid-cols-2 gap-4">
              <el-button type="primary" @click="handleManualUpdateDailyData" :loading="loading.dailyData">更新当日数据</el-button>
              <el-button type="success" @click="handleManualUpdateStockList" :loading="loading.stockList">更新股票列表</el-button>
            </div>
          </div>

          <el-divider />

          <!-- Update Progress Section -->
          <div>
            <h3 class="text-md font-semibold mb-3 text-gray-300">更新进度</h3>
            <div class="space-y-4">
              <!-- Daily Data Progress -->
              <div>
                <div class="flex justify-between items-center mb-1">
                  <span class="text-sm">
                    当日数据更新
                    <span v-if="lastUpdateTimes?.daily_data" class="text-xs text-gray-400 ml-2">
                      (上次: {{ formatDateTime(lastUpdateTimes.daily_data) }})
                    </span>
                  </span>
                  <span class="text-xs text-gray-400">{{ dailyUpdateTask?.message || '等待任务' }}</span>
                </div>
                <el-progress :percentage="dailyUpdateTask?.progress || 0" :status="dailyUpdateTask?.success === false ? 'exception' : ''" />
              </div>
              <!-- Stock List Progress -->
              <div>
                <div class="flex justify-between items-center mb-1">
                  <span class="text-sm">
                    股票列表更新
                    <span v-if="lastUpdateTimes?.stock_list" class="text-xs text-gray-400 ml-2">
                      (上次: {{ formatDateTime(lastUpdateTimes.stock_list) }})
                    </span>
                  </span>
                  <span class="text-xs text-gray-400">{{ stockListUpdateTask?.message || '等待任务' }}</span>
                </div>
                <el-progress :percentage="stockListUpdateTask?.progress || 0" :status="stockListUpdateTask?.success === false ? 'exception' : ''" />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Right Column -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span>任务列表</span>
              <div>
                <el-button text @click="handleRequestStatusUpdate" class="mr-4">刷新状态</el-button>
                <el-button type="danger" plain @click="handleResetJobs" :loading="loading.reset">重置所有任务</el-button>
              </div>
            </div>
          </template>
          <el-table :data="schedulerStatus.jobs" v-loading="tableLoading" element-loading-text="连接实时服务中..." class="w-full">
            <template #empty>
                <div class="p-8 text-center text-gray-400">
                  <p>暂无任务。</p>
                  <p class="text-sm mt-2">如果系统刚启动，请稍等片刻或点击右上角刷新状态。</p>
                  <p class="text-sm">您也可以重置所有任务为默认设置。</p>
                </div>
            </template>
            <el-table-column prop="name" label="任务名称" />
            <el-table-column prop="next_run_time" label="下次运行时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.next_run_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="trigger" label="触发器" />
            <el-table-column label="操作" width="160">
              <template #default="{ row }">
                <el-button text type="primary" @click="handleEdit(row)" class="!p-0">编辑</el-button>
                <el-button text type="danger" @click="handleDelete(row.id)" :loading="loading.delete === row.id" class="!p-0">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- Edit Dialog -->
    <el-dialog v-model="dialogVisible" title="编辑任务" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="任务ID">
          <el-input v-model="editForm.id" disabled />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="editForm.name" disabled />
        </el-form-item>
        <el-form-item label="触发类型">
           <el-select v-model="editForm.trigger.type" @change="handleTriggerTypeChange">
            <el-option label="Cron" value="cron" />
            <el-option label="Interval" value="interval" />
          </el-select>
        </el-form-item>
        <div v-if="editForm.trigger.type === 'cron'">
            <el-form-item label="星期">
                <el-input v-model="editForm.trigger.day_of_week" placeholder="例如: mon-fri, sat" />
            </el-form-item>
             <el-form-item label="小时">
                <el-input v-model="editForm.trigger.hour" placeholder="0-23" />
            </el-form-item>
             <el-form-item label="分钟">
                <el-input v-model="editForm.trigger.minute" placeholder="0-59" />
            </el-form-item>
        </div>
         <div v-if="editForm.trigger.type === 'interval'">
            <el-form-item label="秒数">
                <el-input v-model="editForm.trigger.seconds" type="number" min="1" />
            </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="loading.save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useSchedulerStore } from '@/store/scheduler';
import {
  rescheduleJob,
  deleteJob
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

// --- Computed Properties from Pinia Store ---
const schedulerStatus = computed<SchedulerStatus>(() => store.status);
const dailyUpdateTask = computed(() => store.taskStatus['update_daily_data'] || {});
const stockListUpdateTask = computed(() => store.taskStatus['update_stock_list'] || {});
const tableLoading = computed(() => !store.isConnected);
const lastUpdateTimes = computed(() => store.last_update_times);

// --- WebSocket Connection ---
onMounted(() => {
  if (!store.isConnected) {
    store.connect();
  } else {
    store.requestStatusUpdate();
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
  store.taskStatus[`update_${taskName}`] = { progress: 0, message: '请求已发送...', success: undefined };
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
</script>