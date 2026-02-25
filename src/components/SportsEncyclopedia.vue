<script setup>
import { ref } from 'vue'
import sportsEncyclopediaData from '../data/sportsEncyclopedia.json'

const sports = ref(sportsEncyclopediaData)
const selectedSport = ref(null)

const fields = [
  { key: 'description', label: '项目简介', icon: 'fa-info-circle' },
  { key: 'basicRules', label: '基本规则', icon: 'fa-list-ol' },
  { key: 'equipment', label: '所需装备', icon: 'fa-tshirt' },
  { key: 'suitableFor', label: '适合人群', icon: 'fa-users' },
  { key: 'safetyTips', label: '安全提示', icon: 'fa-shield-alt' },
  { key: 'healthValue', label: '体育价值', icon: 'fa-heartbeat' }
]

function openDetail(sport) {
  selectedSport.value = sport
}

function closeDetail() {
  selectedSport.value = null
}
</script>

<template>
  <div class="encyclopedia">
    <h2 class="module-title">
      <i class="fas fa-book"></i>
      运动百科
    </h2>
    <p class="module-desc">常见运动项目介绍：项目简介、基本规则、所需装备、适合人群、安全提示与体育价值。</p>

    <div class="sports-grid">
      <div
        v-for="sport in sports"
        :key="sport.id"
        class="sport-card card"
        @click="openDetail(sport)"
      >
        <i class="fas sport-icon" :class="sport.icon"></i>
        <h3>{{ sport.name }}</h3>
        <span class="sport-category">{{ sport.category }}</span>
        <p class="sport-desc-preview">{{ sport.description.slice(0, 60) }}{{ sport.description.length > 60 ? '…' : '' }}</p>
        <span class="read-more">查看详情 <i class="fas fa-chevron-right"></i></span>
      </div>
    </div>

    <div v-if="selectedSport" class="modal-overlay" @click.self="closeDetail">
      <div class="modal-content card">
        <button class="modal-close" @click="closeDetail" aria-label="关闭"><i class="fas fa-times"></i></button>
        <div class="modal-header">
          <i class="fas modal-icon" :class="selectedSport.icon"></i>
          <div>
            <h2 class="modal-title">{{ selectedSport.name }}</h2>
            <span class="sport-category">{{ selectedSport.category }}</span>
          </div>
        </div>
        <div class="modal-body">
          <div v-for="f in fields" :key="f.key" class="field-block">
            <h4><i class="fas" :class="f.icon"></i> {{ f.label }}</h4>
            <p>{{ selectedSport[f.key] }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.encyclopedia { color: #111; }
.module-title { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600; }
.module-desc { margin: 0 0 1.5rem 0; color: #666; font-size: 0.9rem; }
.sports-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; }
.sport-card { cursor: pointer; transition: border-color 0.2s, background 0.2s; }
.sport-card:hover { border-color: #999; background: #fafafa; }
.card { background: #fff; padding: 1.25rem; border: 1px solid #e5e5e5; }
.sport-icon { font-size: 1.75rem; color: #111; margin-bottom: 0.5rem; display: block; }
.sport-card h3 { margin: 0 0 0.35rem 0; font-size: 1.05rem; font-weight: 600; }
.sport-category { font-size: 0.75rem; color: #666; display: inline-block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
.sport-desc-preview { margin: 0 0 0.75rem 0; font-size: 0.9rem; color: #555; line-height: 1.4; }
.read-more { font-size: 0.8rem; color: #333; font-weight: 500; display: inline-flex; align-items: center; gap: 0.35rem; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 2rem; }
.modal-content { position: relative; max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto; background: #fff; }
.modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.25rem; color: #666; cursor: pointer; padding: 0.25rem; }
.modal-close:hover { color: #000; }
.modal-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-right: 2rem; }
.modal-icon { font-size: 2rem; color: #111; }
.modal-title { margin: 0 0 0.25rem 0; font-size: 1.35rem; font-weight: 600; }
.modal-body .field-block { margin-bottom: 1.25rem; }
.modal-body h4 { margin: 0 0 0.5rem 0; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
.modal-body h4 i { color: #333; width: 1.2rem; }
.modal-body p { margin: 0; font-size: 0.9rem; color: #555; line-height: 1.6; }
</style>
