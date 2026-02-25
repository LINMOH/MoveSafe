<script setup>
import { ref } from 'vue'
import AssessmentModule from './components/AssessmentModule.vue'
import SportsNews from './components/SportsNews.vue'
import SportsEncyclopedia from './components/SportsEncyclopedia.vue'
import Dashboard from './components/Dashboard.vue'
import HealthAssessment from './components/HealthAssessment.vue'

const activeTab = ref('dashboard')

const tabs = [
  { id: 'dashboard', label: '仪表盘', icon: 'fa-tachometer-alt' },
  { id: 'assessment', label: '环境评估', icon: 'fa-chart-line' },
  { id: 'health', label: '健康评估', icon: 'fa-heartbeat' },
  { id: 'news', label: '体育新闻', icon: 'fa-newspaper' },
  { id: 'encyclopedia', label: '运动百科', icon: 'fa-book' }
]
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-content">
        <div class="logo-section">
          <i class="fas fa-running logo-icon"></i>
          <div class="logo-text">
            <h1>MoveSafe</h1>
            <p class="subtitle">智能运动环境评估与体育信息服务平台</p>
          </div>
        </div>
        <div class="header-info">
          <div class="info-item">
            <i class="fas fa-heartbeat"></i>
            <span>健康运动 · 科学评估</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="app-main">
      <!-- 侧边栏导航 -->
      <nav class="sidebar">
        <div class="sidebar-content">
          <div class="user-info">
            <div class="avatar">
              <i class="fas fa-user-circle"></i>
            </div>
            <div class="user-details">
              <h3>运动爱好者</h3>
              <p>欢迎使用MoveSafe</p>
            </div>
          </div>
          
          <ul class="nav-menu">
            <li 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              <i class="fas" :class="tab.icon"></i>
              <span>{{ tab.label }}</span>
            </li>
          </ul>
          
          <div class="sidebar-footer">
            <div class="system-status">
              <i class="fas fa-circle status-icon"></i>
              <span>系统运行正常</span>
            </div>
            <p class="version">版本 1.0.0</p>
          </div>
        </div>
      </nav>

      <!-- 内容区域 -->
      <div class="content-area">
        <div class="content-container">
          <div v-if="activeTab === 'dashboard'">
            <Dashboard />
          </div>
          <div v-else-if="activeTab === 'assessment'">
            <AssessmentModule />
          </div>
          <div v-else-if="activeTab === 'health'">
            <HealthAssessment />
          </div>
          <div v-else-if="activeTab === 'news'">
            <SportsNews />
          </div>
          <div v-else-if="activeTab === 'encyclopedia'">
            <SportsEncyclopedia />
          </div>
        </div>
      </div>
    </main>

    <!-- 页脚 -->

  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.app-header {
  background: #000;
  color: #fff;
  padding: 1rem 2rem;
  border-bottom: 1px solid #333;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  font-size: 2rem;
  color: #fff;
  opacity: 0.9;
}

.logo-text h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0.2rem 0 0 0;
  font-size: 0.8rem;
  opacity: 0.7;
}

.header-info {
  display: flex;
  gap: 2rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.info-item i {
  opacity: 0.8;
}

.app-main {
  flex: 1;
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem;
}

.sidebar {
  width: 220px;
  background: #fff;
  border: 1px solid #e5e5e5;
  margin-right: 2rem;
  overflow: hidden;
}

.sidebar-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.user-info {
  padding: 1.5rem;
  background: #fafafa;
  border-bottom: 1px solid #e5e5e5;
  text-align: center;
}

.avatar {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.user-details h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111;
}

.user-details p {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
}

.nav-menu {
  flex: 1;
  padding: 1rem 0;
}

.nav-menu li {
  list-style: none;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
  color: #666;
  font-size: 0.9rem;
}

.nav-menu li:hover {
  background: #f5f5f5;
  color: #111;
}

.nav-menu li.active {
  background: #f5f5f5;
  color: #000;
  font-weight: 500;
  border-left: 3px solid #000;
}

.nav-menu li i {
  width: 18px;
  text-align: center;
}

.sidebar-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e5e5e5;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  color: #888;
  font-size: 0.8rem;
}

.status-icon {
  font-size: 0.5rem;
  color: #000;
}

.version {
  color: #999;
  font-size: 0.75rem;
  margin: 0;
}

.content-area {
  flex: 1;
}

.content-container {
  background: #fff;
  border: 1px solid #e5e5e5;
  padding: 2rem;
  height: 100%;
}

.app-footer {
  background: #111;
  color: #fff;
  padding: 2rem;
  margin-top: auto;
  border-top: 1px solid #333;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.footer-section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}

.footer-section p, .footer-section ul {
  margin: 0;
  color: #999;
  font-size: 0.85rem;
}

.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section ul li {
  margin-bottom: 0.5rem;
}

.copyright {
  text-align: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #333;
  color: #666;
  font-size: 0.8rem;
}
</style>
