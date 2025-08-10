<template>
  <el-card class="template-card">
    <template #header>
      <span>快速筛选模板</span>
    </template>
    
    <div class="template-buttons">
      <el-button 
        v-for="template in quickTemplates" 
        :key="template.id"
        :type="template.id === selectedTemplate ? 'primary' : 'default'"
        @click="handleApplyTemplate(template)"
        class="template-button"
      >
        <el-icon><component :is="template.icon" /></el-icon>
        {{ template.name }}
      </el-button>
    </div>
    
    <div class="template-description" v-if="selectedTemplateInfo">
      <el-alert :title="selectedTemplateInfo.description" type="info" show-icon :closable="false" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, Money, Trophy, DataAnalysis } from '@element-plus/icons-vue'

// Props & Emits
const props = defineProps<{
  selectedTemplate: string
}>()

const emit = defineEmits<{
  'apply-template': [template: any]
  'update:selectedTemplate': [templateId: string]
}>()

// 快速筛选模板
const quickTemplates = ref<any[]>([])

// 计算当前选中模板的描述
const selectedTemplateInfo = computed(() => {
  return quickTemplates.value.find(t => t.id === props.selectedTemplate)
})

// 应用模板
const handleApplyTemplate = (template: any) => {
  emit('update:selectedTemplate', template.id)
  emit('apply-template', template)
  ElMessage.success(`已应用${template.name}模板`)
}
</script>

<style lang="scss" scoped>
.template-card {
  margin-bottom: 20px;
  
  .template-buttons {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
    
    .template-button {
      height: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      
      .el-icon {
        margin-bottom: 4px;
      }
    }
  }
  
  .template-description {
    :deep(.el-alert) {
      .el-alert__content {
        font-size: 12px;
      }
    }
  }
}

@media (max-width: 768px) {
  .template-card {
    .template-buttons {
      grid-template-columns: repeat(2, 1fr);
      
      .template-button {
        height: 40px;
        font-size: 11px;
      }
    }
  }
}
</style> 