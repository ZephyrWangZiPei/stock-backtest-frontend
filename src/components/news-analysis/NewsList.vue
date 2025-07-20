<template>
  <div class="news-section">
    <div class="news-header">
      <div class="header-left">
        <h3 class="section-title">
          <el-icon class="section-icon">
            <Document />
          </el-icon>
          相关新闻
        </h3>
        <span class="news-count">{{ news.length }} 条</span>
      </div>
      <div class="news-actions">
        <el-button
          @click="toggleShowAll"
          size="small"
          type="primary"
          :icon="showAllNews ? 'ArrowUp' : 'ArrowDown'"
          class="action-button"
        >
          {{ showAllNews ? '收起详情' : '展开详情' }}
        </el-button>
        <el-button
          @click="handleExport"
          size="small"
          type="success"
          :icon="Download"
          class="action-button"
        >
          导出新闻
        </el-button>
      </div>
    </div>

    <!-- 新闻来源统计 -->
    <div class="news-stats">
      <div class="stats-row">
        <div class="stat-item">
          <el-icon class="stat-icon cctv">
            <VideoPlay />
          </el-icon>
          <span class="stat-label">CCTV</span>
          <span class="stat-count">{{ getNewsCountBySource('CCTV') }}</span>
        </div>
        <div class="stat-item">
          <el-icon class="stat-icon baidu">
            <Search />
          </el-icon>
          <span class="stat-label">百度</span>
          <span class="stat-count">{{ getNewsCountBySource('百度经济') }}</span>
        </div>
        <div class="stat-item">
          <el-icon class="stat-icon eastmoney">
            <TrendCharts />
          </el-icon>
          <span class="stat-label">东方财富</span>
          <span class="stat-count">{{ getNewsCountBySource('东方财富') }}</span>
        </div>
        <div class="stat-item">
          <el-icon class="stat-icon market">
            <DataBoard />
          </el-icon>
          <span class="stat-label">市场</span>
          <span class="stat-count">{{ getNewsCountBySource('市场新闻') }}</span>
        </div>
      </div>
    </div>

    <!-- 新闻列表 -->
    <div class="news-list">
      <div
        v-for="(newsItem, index) in news"
        :key="index"
        class="news-item"
      >
        <el-card
          class="news-card"
          shadow="hover"
        >
          <div class="news-content">
            <div class="news-header">
              <div class="news-meta">
                <el-tag
                  size="small"
                  type="info"
                  class="source-tag"
                >
                  <el-icon class="tag-icon">
                    <component :is="getSourceIcon(newsItem.source)" />
                  </el-icon>
                  {{ newsItem.source }}
                </el-tag>
                <span class="news-time">
                  <el-icon class="time-icon">
                    <Clock />
                  </el-icon>
                  {{ formatDate(newsItem.publish_time) }}
                </span>
                <span class="news-length">
                  <el-icon class="length-icon">
                    <Document />
                  </el-icon>
                  {{ newsItem.content.length }} 字符
                </span>
              </div>
            </div>

            <div class="news-body">
              <h4 class="news-title">{{ newsItem.title }}</h4>

              <div class="news-sentiment">
                <el-tag
                  :type="getSentimentTagType(newsItem.sentiment)"
                  size="small"
                  class="sentiment-tag"
                >
                  <el-icon class="sentiment-icon">
                    <component :is="getSentimentIcon(newsItem.sentiment)" />
                  </el-icon>
                  {{ getSentimentText(newsItem.sentiment) }}
                </el-tag>
                <span class="sentiment-score">
                  得分: {{ newsItem.sentiment_score?.toFixed(2) || 'N/A' }}
                </span>
              </div>

              <!-- 新闻内容 -->
              <div class="news-text-section">
                <p class="news-text">
                  {{ expandedNews[index] || showAllNews ? newsItem.content : getTruncatedContent(newsItem.content) }}
                </p>
                <el-button
                  v-if="newsItem.content.length > 200"
                  @click="toggleNewsContent(index)"
                  type="primary"
                  link
                  size="small"
                  class="expand-button"
                >
                  <el-icon class="expand-icon">
                    <component :is="expandedNews[index] ? 'ArrowUp' : 'ArrowDown'" />
                  </el-icon>
                  {{ expandedNews[index] ? '收起' : '展开全文' }}
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Document,
  Download,
  VideoPlay,
  Search,
  TrendCharts,
  DataBoard,
  Clock,
  ArrowUp,
  ArrowDown,
  CircleCheck,
  CircleClose,
  Warning
} from '@element-plus/icons-vue'
import { formatDate } from '@/utils/format'

/**
 * 新闻项接口
 */
export interface NewsItem {
  title: string
  content: string
  source: string
  publish_time: string
  sentiment: 'positive' | 'negative' | 'neutral'
  sentiment_score: number
}

/**
 * 组件属性
 */
interface Props {
  /** 新闻列表 */
  news: NewsItem[]
  /** 是否显示所有新闻 */
  showAllNews?: boolean
}

/**
 * 组件事件
 */
interface Emits {
  /** 切换显示所有新闻 */
  (e: 'toggle-show-all'): void
  /** 导出新闻 */
  (e: 'export'): void
}

const props = withDefaults(defineProps<Props>(), {
  news: () => [],
  showAllNews: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const expandedNews = ref<{ [key: number]: boolean }>({})

// 方法
const getNewsCountBySource = (source: string) => {
  const count = props.news.filter(news => {
    const newsSource = news.source?.toLowerCase() || ''

    // 定义来源映射规则
    const sourceMappings = {
      'CCTV': ['cctv', '央视', '中央电视台', 'cctv新闻'],
      '百度经济': ['百度', 'baidu', '百度经济', '百度财经', '百度新闻'],
      '东方财富': ['东方财富', 'eastmoney', '东方', '东方财富网', '东方财经'],
      '市场新闻': ['市场', 'market', '财经', '市场新闻', '财经新闻', '经济新闻']
    }

    // 获取当前来源的匹配规则
    const mappings = sourceMappings[source as keyof typeof sourceMappings] || []

    // 检查是否匹配任何规则
    return mappings.some(mapping => newsSource.includes(mapping))
  }).length

  return count
}

const getTruncatedContent = (content: string) => {
  return content.length > 200 ? content.substring(0, 200) + '...' : content
}

const toggleNewsContent = (index: number) => {
  expandedNews.value[index] = !expandedNews.value[index]
}

const getSentimentText = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return '正面'
    case 'negative':
      return '负面'
    default:
      return '中性'
  }
}

const getSentimentTagType = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return 'success'
    case 'negative':
      return 'danger'
    default:
      return 'info'
  }
}

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return 'CircleCheck'
    case 'negative':
      return 'CircleClose'
    default:
      return 'Warning'
  }
}

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'CCTV':
      return 'VideoPlay'
    case '百度经济':
      return 'Search'
    case '东方财富':
      return 'TrendCharts'
    case '市场新闻':
      return 'DataBoard'
    default:
      return 'Document'
  }
}

const toggleShowAll = () => {
  emit('toggle-show-all')
}

const handleExport = () => {
  emit('export')
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/mixins.scss' as *;

.news-section {
  .news-header {
    @include flex(row, space-between, center);
    margin-bottom: $spacing-xl;
    
      .header-left {
        @include flex(row, flex-start, center);
        gap: $spacing-md;
    
        .section-title {
          @include flex(row, flex-start, center);
          margin: 0;
          font-size: $font-size-large;
          font-weight: $font-weight-bold;
            color: $text-primary;
          
            .section-icon {
              margin-right: $spacing-sm;
              color: $primary-color;
            }
          }
          
          .news-count {
            font-size: $font-size-small;
            color: $text-secondary;
            background: $bg-secondary;
            padding: $spacing-xs $spacing-sm;
            border-radius: $card-border-radius;
            font-weight: $font-weight-medium;
          }
          }
          
          .news-actions {
            @include flex(row, flex-end, center);
            gap: $spacing-sm;
          
            .action-button {
              @include flex(row, center, center);
              gap: $spacing-xs;
            }
          }
          }
          
          .news-stats {
            margin-bottom: 16px;
            
              .stats-row {
                display: flex;
                gap: 16px;
            
                .stat-item {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  padding: 8px 12px;
                  background: var(--el-bg-color-page);
                  border-radius: 6px;
                  border: 1px solid var(--el-border-color-lighter);
            
                  .stat-icon {
                    font-size: 14px;
            
                    &.cctv {
                      color: #ff6b6b;
                    }
            
                    &.baidu {
                      color: #4ecdc4;
                    }
            
                    &.eastmoney {
                      color: #45b7d1;
                    }
            
                    &.market {
                      color: #f093fb;
                    }
                  }
            
                  .stat-label {
                    font-size: 12px;
                    color: var(--el-text-color-regular);
                  }
            
                  .stat-count {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--el-text-color-primary);
                  }
                }
              }
            
              @media (max-width: 768px) {
                .stats-row {
                  flex-wrap: wrap;
                  gap: 8px;
              }
            }
          }
          
          .news-list {
            .news-item {
              margin-bottom: $spacing-lg;
          
              .news-card {
                @include card-base;
                border: none;
                transition: all $transition-base $ease-in-out;
          
                &:hover {
                  transform: translateY(-2px);
                  box-shadow: $box-shadow-dark;
                }
          
                .news-content {
                  .news-header {
                    margin-bottom: $spacing-md;
          
                    .news-meta {
                      @include flex(row, flex-start, center);
                      gap: $spacing-md;
                      flex-wrap: wrap;
          
                      .source-tag {
                        @include flex(row, center, center);
                        gap: $spacing-xs;
          
                        .tag-icon {
                          font-size: $font-size-small;
                        }
                      }
          
                      .news-time,
                      .news-length {
                        @include flex(row, center, center);
                        gap: $spacing-xs;
                        font-size: $font-size-small;
                        color: $text-secondary;
          
                        .time-icon,
                        .length-icon {
                          font-size: $font-size-small;
                        }
                      }
                    }
                  }
          
                  .news-body {
                    .news-title {
                      margin: 0 0 $spacing-md 0;
                      font-size: $font-size-medium;
                      font-weight: $font-weight-bold;
                      color: $text-primary;
                      line-height: 1.4;
                    }
          
                    .news-sentiment {
                      @include flex(row, flex-start, center);
                      gap: $spacing-md;
                      margin-bottom: $spacing-md;
          
                      .sentiment-tag {
                        @include flex(row, center, center);
                        gap: $spacing-xs;
          
                        .sentiment-icon {
                          font-size: $font-size-small;
                        }
                      }
          
                      .sentiment-score {
                        font-size: $font-size-small;
                        color: $text-secondary;
                        font-weight: $font-weight-medium;
                      }
                    }
          
                    .news-text-section {
                      .news-text {
                        margin: 0 0 $spacing-sm 0;
                        font-size: $font-size-base;
                        line-height: 1.6;
                        color: $text-regular;
                        text-align: justify;
                      }
          
                      .expand-button {
                        @include flex(row, center, center);
                        gap: $spacing-xs;
                        font-weight: $font-weight-medium;
          
                        .expand-icon {
                          font-size: $font-size-small;
                        }
                      }
                    }
          }
        }
      }
    }
  }
}

// 响应式设计
@include respond-to(sm) {
  .news-section {
    .news-header {
      flex-direction: column;
      gap: $spacing-md;
      align-items: flex-start;
    }

    .news-stats {
      .stats-grid {
        gap: $spacing-md;
      }
    }
  }
}
</style> 