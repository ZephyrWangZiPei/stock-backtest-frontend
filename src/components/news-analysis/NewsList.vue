<template>
  <div class="news-section">
    <div class="news-header">
      <h3 class="section-title">
        <el-icon class="section-icon">
          <Document />
        </el-icon>
        相关新闻 ({{ news.length }} 条)
      </h3>
      <div class="news-actions">
        <el-button
          @click="toggleShowAll"
          size="small"
          type="primary"
          :icon="showAllNews ? 'ArrowUp' : 'ArrowDown'"
        >
          {{ showAllNews ? '收起详情' : '展开详情' }}
        </el-button>
        <el-button
          @click="handleExport"
          size="small"
          type="success"
          :icon="Download"
        >
          导出新闻
        </el-button>
      </div>
    </div>

    <!-- 新闻统计 -->
    <div class="news-stats">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value positive">{{ getNewsCountBySource('CCTV') }}</div>
          <div class="stat-label">CCTV新闻</div>
        </div>
        <div class="stat-item">
          <div class="stat-value primary">{{ getNewsCountBySource('百度经济') }}</div>
          <div class="stat-label">百度经济</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ getNewsCountBySource('东方财富') }}</div>
          <div class="stat-label">东方财富</div>
        </div>
        <div class="stat-item">
          <div class="stat-value info">{{ getNewsCountBySource('市场新闻') }}</div>
          <div class="stat-label">市场新闻</div>
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
        <el-card class="news-card" shadow="hover">
          <div class="news-content">
            <div class="news-header">
              <h4 class="news-title">{{ newsItem.title }}</h4>
              <div class="news-meta">
                <el-tag size="small" type="info">{{ newsItem.source }}</el-tag>
                <span class="news-time">{{ formatDate(newsItem.publish_time) }}</span>
                <span class="news-length">{{ newsItem.content.length }} 字符</span>
              </div>
            </div>

            <div class="news-sentiment">
              <el-tag
                :type="getSentimentTagType(newsItem.sentiment)"
                size="small"
              >
                {{ getSentimentText(newsItem.sentiment) }}
              </el-tag>
              <span class="sentiment-score">
                得分: {{ newsItem.sentiment_score?.toFixed(2) || 'N/A' }}
              </span>
            </div>

            <!-- 新闻内容 -->
            <div class="news-body">
              <p class="news-text">
                {{ expandedNews[index] || showAllNews ? newsItem.content : getTruncatedContent(newsItem.content) }}
              </p>
              <el-button
                v-if="newsItem.content.length > 200"
                @click="toggleNewsContent(index)"
                type="primary"
                link
                size="small"
              >
                {{ expandedNews[index] ? '收起' : '展开全文' }}
              </el-button>
            </div>

            <!-- 新闻标签 -->
            <div class="news-tags">
              <el-tag size="small">{{ newsItem.source }}</el-tag>
              <el-tag
                size="small"
                :type="getSentimentTagType(newsItem.sentiment)"
              >
                {{ getSentimentText(newsItem.sentiment) }}
              </el-tag>
              <el-tag size="small" type="info">{{ formatDate(newsItem.publish_time) }}</el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Document, Download } from '@element-plus/icons-vue'
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
  return props.news.filter(news => news.source === source).length
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

const toggleShowAll = () => {
  emit('toggle-show-all')
}

const handleExport = () => {
  emit('export')
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
@import '@/assets/styles/mixins.scss';

.news-section {
  .news-header {
    @include flex(row, space-between, center);
    margin-bottom: $spacing-lg;

    .section-title {
      @include flex(row, flex-start, center);
      margin: 0;
      font-size: $font-size-large;
      font-weight: $font-weight-medium;
      color: $text-primary;

      .section-icon {
        margin-right: $spacing-sm;
      }
    }

    .news-actions {
      @include flex(row, flex-end, center);
      gap: $spacing-sm;
    }
  }

  .news-stats {
    margin-bottom: $spacing-lg;

    .stats-grid {
      @include grid(4, $spacing-md);

      .stat-item {
        @include flex(column, center, center);
        padding: $spacing-lg;
        background-color: $bg-secondary;
        border-radius: $card-border-radius;
        text-align: center;

        .stat-value {
          font-size: $font-size-extra-large;
          font-weight: $font-weight-bold;
          margin-bottom: $spacing-xs;

          &.positive {
            color: $success-color;
          }

          &.primary {
            color: $primary-color;
          }

          &.warning {
            color: $warning-color;
          }

          &.info {
            color: $info-color;
          }
        }

        .stat-label {
          color: $text-regular;
          font-size: $font-size-small;
        }
      }
    }
  }

  .news-list {
    .news-item {
      margin-bottom: $spacing-lg;

      .news-card {
        @include card-base;

        .news-content {
          .news-header {
            margin-bottom: $spacing-md;

            .news-title {
              margin: 0 0 $spacing-sm 0;
              font-size: $font-size-medium;
              font-weight: $font-weight-medium;
              color: $text-primary;
              line-height: $line-height-base;
            }

            .news-meta {
              @include flex(row, flex-start, center);
              gap: $spacing-sm;

              .news-time,
              .news-length {
                color: $text-secondary;
                font-size: $font-size-extra-small;
              }
            }
          }

          .news-sentiment {
            @include flex(row, flex-start, center);
            gap: $spacing-sm;
            margin-bottom: $spacing-md;

            .sentiment-score {
              color: $text-regular;
              font-size: $font-size-small;
            }
          }

          .news-body {
            margin-bottom: $spacing-md;

            .news-text {
              color: $text-regular;
              font-size: $font-size-small;
              line-height: $line-height-base;
              margin: 0 0 $spacing-sm 0;
              white-space: pre-wrap;
            }
          }

          .news-tags {
            @include flex(row, flex-start, center);
            gap: $spacing-xs;
            flex-wrap: wrap;
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
      align-items: flex-start;
      gap: $spacing-sm;

      .news-actions {
        width: 100%;
        justify-content: flex-start;
      }
    }

    .news-stats {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }
}
</style> 