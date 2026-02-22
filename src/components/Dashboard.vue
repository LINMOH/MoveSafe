<script setup>
import { ref, computed } from 'vue'

const demoScore = ref(72)

const gaugeColor = computed(() =>
  demoScore.value >= 80 ? '#000' : demoScore.value >= 60 ? '#555' : '#999'
)

const cards = [
  { id: 'assessment', title: '环境评估', desc: '输入温度、AQI、湿度等参数，获取运动适宜度评分与建议', icon: 'fa-chart-line' },
  { id: 'news', title: '体育新闻', desc: '浏览近期体育资讯，按类别筛选', icon: 'fa-newspaper' },
  { id: 'encyclopedia', title: '运动百科', desc: '常见运动项目介绍、规则、装备与安全提示', icon: 'fa-book' }
]
</script>

<template>
  <div class="dashboard">
    <h2 class="dashboard-title">
      <i class="fas fa-tachometer-alt"></i>
      仪表盘
    </h2>
    <p class="dashboard-desc">运动适宜性分析概览与快捷入口</p>

    <div class="dashboard-grid">
      <div class="gauge-card card">
        <h3>综合适宜度示意</h3>
        <p class="gauge-hint">下方为示例评分，前往「环境评估」输入实际参数获取结果</p>
        <div class="gauge-wrap">
          <div class="gauge-svg" role="img" aria-label="适宜度仪表">
            <svg viewBox="0 0 120 80" class="gauge-svg-inner">
              <path class="gauge-bg" d="M 20 60 A 40 40 0 0 1 100 60" fill="none" stroke="#e5e5e5" stroke-width="12" stroke-linecap="round" />
              <path class="gauge-fill" :stroke="gaugeColor" fill="none" stroke-width="12" stroke-linecap="round" d="M 20 60 A 40 40 0 0 1 100 60" :style="{ strokeDasharray: 125.66, strokeDashoffset: 125.66 - (125.66 * demoScore / 100) }" />
            </svg>
            <span class="gauge-value" :style="{ color: gaugeColor }">{{ demoScore }}</span>
          </div>
        </div>
        <div class="gauge-legend">
          <span><span class="leg-dot leg-good"></span> 80-100 适合</span>
          <span><span class="leg-dot leg-mid"></span> 60-79 谨慎</span>
          <span><span class="leg-dot leg-poor"></span> 0-59 不建议</span>
        </div>
      </div>

      <div class="cards-section">
        <h3>功能入口</h3>
        <div class="feature-cards">
          <div v-for="c in cards" :key="c.id" class="feature-card card">
            <i class="fas feature-icon" :class="c.icon"></i>
            <h4>{{ c.title }}</h4>
            <p>{{ c.desc }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard { color: #111; }
.dashboard-title { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600; }
.dashboard-desc { margin: 0 0 1.5rem 0; color: #666; font-size: 0.9rem; }
.dashboard-grid { display: grid; grid-template-columns: 300px 1fr; gap: 2rem; }
@media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }
.card { background: #fff; padding: 1.5rem; border: 1px solid #e5e5e5; }
.gauge-card h3, .cards-section h3 { margin: 0 0 1rem 0; font-size: 1rem; font-weight: 600; }
.gauge-hint { margin: 0 0 1rem 0; font-size: 0.8rem; color: #888; }
.gauge-wrap { height: 220px; display: flex; align-items: center; justify-content: center; }
.gauge-svg { position: relative; width: 280px; height: 160px; }
.gauge-svg-inner { width: 100%; height: 100%; }
.gauge-fill { transition: stroke-dashoffset 0.5s ease, stroke 0.3s ease; }
.gauge-value { position: absolute; left: 50%; bottom: 8px; transform: translateX(-50%); font-size: 28px; font-weight: 600; }
.gauge-legend { display: flex; gap: 1.5rem; justify-content: center; margin-top: 0.5rem; font-size: 0.8rem; color: #666; }
.gauge-legend .leg-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.35rem; vertical-align: middle; }
.gauge-legend .leg-good { background: #000; }
.gauge-legend .leg-mid { background: #555; }
.gauge-legend .leg-poor { background: #999; }
.cards-section { display: flex; flex-direction: column; gap: 1rem; }
.feature-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.feature-card { border-top: 2px solid #000; }
.feature-icon { font-size: 1.25rem; margin-bottom: 0.5rem; color: #111; }
.feature-card h4 { margin: 0 0 0.35rem 0; font-size: 1rem; font-weight: 600; }
.feature-card p { margin: 0; font-size: 0.85rem; color: #666; line-height: 1.4; }
</style>
