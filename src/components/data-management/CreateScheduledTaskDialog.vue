<template>
  <el-dialog
    v-model="visible"
    title="新建定时任务"
    width="600px"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="任务名称" required>
        <el-input
          v-model="form.name"
          placeholder="输入任务名称"
        />
      </el-form-item>
      <el-form-item label="任务描述">
        <el-input
          v-model="form.description"
          type="textarea"
          placeholder="输入任务描述"
        />
      </el-form-item>
      <el-form-item label="任务类型" required>
        <el-select v-model="form.task_type" placeholder="选择任务类型">
          <el-option label="数据采集" value="data_collection" />
          <el-option label="数据更新" value="data_update" />
          <el-option label="数据分析" value="data_analysis" />
          <el-option label="系统维护" value="system_maintenance" />
        </el-select>
      </el-form-item>
      <el-form-item label="执行时间" required>
        <el-time-picker
          v-model="form.execution_time"
          format="HH:mm"
          placeholder="选择执行时间"
        />
      </el-form-item>
      <el-form-item label="执行频率" required>
        <el-select v-model="form.frequency" placeholder="选择执行频率">
          <el-option label="每天" value="daily" />
          <el-option label="每周" value="weekly" />
          <el-option label="每月" value="monthly" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </el-form-item>
      <el-form-item label="参数配置">
        <el-input
          v-model="form.parameters"
          type="textarea"
          placeholder="输入任务参数（JSON格式）"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">
          创建任务
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

// Props
interface Props {
  modelValue: boolean
  creating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  creating: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  create: [form: any]
}>()

// 响应式数据
const visible = ref(props.modelValue)
const creating = ref(props.creating)

const form = reactive({
  name: '',
  description: '',
  task_type: 'data_collection',
  execution_time: '',
  frequency: 'daily',
  parameters: ''
})

// 监听visible变化
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

watch(() => props.creating, (newVal) => {
  creating.value = newVal
})

// 方法
const handleCreate = () => {
  // 验证表单
  if (!form.name.trim()) {
    ElMessage.error('请输入任务名称')
    return
  }

  if (!form.execution_time) {
    ElMessage.error('请选择执行时间')
    return
  }

  // 验证参数格式
  if (form.parameters.trim()) {
    try {
      JSON.parse(form.parameters)
    } catch (error) {
      ElMessage.error('参数配置格式错误，请输入有效的JSON格式')
      return
    }
  }

  // 发送创建事件
  emit('create', { ...form })
}

const handleCancel = () => {
  visible.value = false
  // 重置表单
  Object.assign(form, {
    name: '',
    description: '',
    task_type: 'data_collection',
    execution_time: '',
    frequency: 'daily',
    parameters: ''
  })
}
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style> 
