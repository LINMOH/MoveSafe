<script setup>
import { ref, computed, onMounted } from 'vue'
import sportsNewsData from '../data/sportsNews.json'

const news = ref([])
const loading = ref(true)
const selectedCategory = ref('全部')
const selectedArticle = ref(null)
const loadingContent = ref(false)

const categories = computed(() => {
  const set = new Set(['全部', ...news.value.map(n => n.category)])
  return Array.from(set)
})

const filteredNews = computed(() => {
  if (selectedCategory.value === '全部') return news.value
  return news.value.filter(n => n.category === selectedCategory.value)
})

async function fetchNews() {
  loading.value = true
  try {
    const data = await window.electronAPI.getNews()
    news.value = Array.isArray(data) ? data : []
  } catch {
    news.value = sportsNewsData.map((n, i) => ({ ...n, source: '新华社（本地缓存）' }))
  } finally {
    loading.value = false
  }
}

async function openDetail(item) {
  selectedArticle.value = { ...item }
  if (item.url && !item.content) {
    loadingContent.value = true
    try {
      const result = await window.electronAPI.getNewsArticle(item.url)
      selectedArticle.value = { ...selectedArticle.value, content: result.content || '（正文加载失败，请点击下方链接查看原文）' }
    } catch {
      selectedArticle.value = { ...selectedArticle.value, content: '（正文加载失败，请点击下方链接查看原文）' }
    } finally {
      loadingContent.value = false
    }
  }
}

function closeDetail() {
  selectedArticle.value = null
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(fetchNews)
</script>

<template>
  <div class="sports-news">
    <h2 class="module-title">
      <i class="fas fa-newspaper"></i>
      体育新闻
    </h2>
    <p class="module-desc">近期体育资讯，支持按运动类别筛选与查看详情。</p>

    <div class="news-toolbar">
      <label>分类筛选：</label>
      <select v-model="selectedCategory" class="category-select">
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <span class="news-source-label">来源：新华社</span>
    </div>

    <p v-if="loading" class="loading-msg">正在加载新华社体育新闻…</p>
    <div v-else class="news-grid">
      <article
        v-for="item in filteredNews"
        :key="item.id"
        class="news-card card"
        @click="openDetail(item)"
      >
        <span class="news-category">{{ item.category }}</span>
        <h3 class="news-title">{{ item.title }}</h3>
        <p class="news-meta">
          <i class="fas fa-calendar-alt"></i> {{ formatDate(item.date) }}
          <span v-if="item.source" class="news-source"> · {{ item.source }}</span>
        </p>
        <p class="news-preview">{{ (item.content || item.title).slice(0, 80) }}{{ (item.content || item.title).length > 80 ? '…' : '' }}</p>
        <span class="read-more">点击查看详情 <i class="fas fa-chevron-right"></i></span>
      </article>
    </div>

    <div v-if="selectedArticle" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-content card">
        <button class="modal-close" @click="closeDetail" aria-label="关闭"><i class="fas fa-times"></i></button>
        <span class="news-category">{{ selectedArticle.category }}</span>
        <h2 class="modal-title">{{ selectedArticle.title }}</h2>
        <p class="news-meta">
          <i class="fas fa-calendar-alt"></i> {{ formatDate(selectedArticle.date) }}
          <span v-if="selectedArticle.source"> · {{ selectedArticle.source }}</span>
        </p>
        <p v-if="loadingContent" class="loading-content">加载正文中…</p>
        <div v-else class="modal-body">{{ selectedArticle.content || '（暂无正文）' }}</div>
        <a v-if="selectedArticle.url" :href="selectedArticle.url" target="_blank" rel="noopener" class="view-original">查看原文</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sports-news { color: #111; }
.module-title { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600; }
.module-desc { margin: 0 0 1.5rem 0; color: #666; font-size: 0.9rem; }
.news-toolbar { margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.category-select { padding: 0.5rem 1rem; border: 1px solid #ddd; font-size: 0.95rem; min-width: 160px; }
.news-source-label { font-size: 0.8rem; color: #888; margin-left: auto; }
.loading-msg { color: #666; font-size: 0.9rem; margin: 2rem 0; }
.news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }
.news-card { cursor: pointer; transition: border-color 0.2s, background 0.2s; }
.news-card:hover { border-color: #999; background: #fafafa; }
.card { background: #fff; padding: 1.25rem; border: 1px solid #e5e5e5; }
.news-category { display: inline-block; font-size: 0.75rem; color: #666; font-weight: 500; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
.news-title { margin: 0 0 0.5rem 0; font-size: 1.05rem; font-weight: 600; color: #111; line-height: 1.4; }
.news-meta { margin: 0 0 0.5rem 0; font-size: 0.8rem; color: #888; }
.news-source { color: #999; }
.news-preview { margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #555; line-height: 1.5; }
.read-more { font-size: 0.8rem; color: #333; font-weight: 500; display: inline-flex; align-items: center; gap: 0.35rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 2rem; }
.modal-content { position: relative; max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto; background: #fff; }
.modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.25rem; color: #666; cursor: pointer; padding: 0.25rem; }
.modal-close:hover { color: #000; }
.modal-title { margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600; padding-right: 2rem; }
.modal-body { margin-top: 1rem; color: #333; line-height: 1.7; white-space: pre-wrap; font-size: 0.95rem; }
.loading-content { margin-top: 1rem; color: #888; font-size: 0.9rem; }
.view-original { display: inline-block; margin-top: 1rem; font-size: 0.9rem; color: #333; text-decoration: underline; }
.view-original:hover { color: #000; }
</style>
