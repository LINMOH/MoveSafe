<script setup>
import { ref, computed } from 'vue'
import {
  getBiologicalMetrics,
  getExerciseMetrics,
  generateRecommendations,
  getBMIColor,
  getBMILabel,
  calculateIdealWeightRange,
  calculateCalorieDeficitSurplus,
  ACTIVITY_LEVELS
} from '../logic/engine'

// 表单数据
const form = ref({
  // 基本信息
  gender: 'male',
  age: 30,
  height: 170,
  weight: 65,
  
  // 活动水平
  activityLevel: 'moderate',
  
  // 目标
  targetWeight: 65,
  timeframeWeeks: 8,
  
  // 季节
  season: 'spring'
})

// 计算结果
const biologicalMetrics = computed(() => {
  return getBiologicalMetrics(
    form.value.height,
    form.value.weight,
    form.value.age,
    form.value.gender,
    form.value.activityLevel
  )
})

const exerciseMetrics = computed(() => {
  return getExerciseMetrics(form.value.age)
})

const recommendations = computed(() => {
  return generateRecommendations(
    biologicalMetrics.value.bmi,
    biologicalMetrics.value.bmiCategory,
    form.value.age,
    biologicalMetrics.value.tdee,
    form.value.season
  )
})

const idealWeightRange = computed(() => {
  return calculateIdealWeightRange(form.value.height)
})

const caloriePlan = computed(() => {
  return calculateCalorieDeficitSurplus(
    form.value.weight,
    form.value.targetWeight,
    form.value.timeframeWeeks
  )
})

// 活动水平选项
const activityLevelOptions = [
  { value: 'sedentary', label: '久坐（办公室工作，很少运动）' },
  { value: 'light', label: '轻度活动（每周1-3天轻度运动）' },
  { value: 'moderate', label: '中度活动（每周3-5天中等强度运动）' },
  { value: 'active', label: '活跃（每周6-7天中等强度运动）' },
  { value: 'veryActive', label: '非常活跃（高强度运动或体力劳动）' }
]

// 季节选项
const seasonOptions = [
  { value: 'spring', label: '春季' },
  { value: 'summer', label: '夏季' },
  { value: 'autumn', label: '秋季' },
  { value: 'winter', label: '冬季' }
]

// 获取活动水平系数
function getActivityMultiplier(level) {
  return ACTIVITY_LEVELS[level]
}

// 获取BMI颜色
const bmiColor = computed(() => {
  return getBMIColor(biologicalMetrics.value.bmiCategory)
})

// 获取BMI标签
const bmiLabel = computed(() => {
  return getBMILabel(biologicalMetrics.value.bmiCategory)
})
</script>

<template>
  <div class="health-assessment">
    <h2 class="module-title">
      <i class="fas fa-heartbeat"></i>
      健康评估
    </h2>
    <p class="module-desc">基于生物指标和运动科学，提供个性化健康建议与运动计划。</p>

    <div class="assessment-layout">
      <!-- 左侧：输入表单 -->
      <section class="form-section card">
        <h3><i class="fas fa-user-edit"></i> 个人信息</h3>
        <form class="health-form">
          <div class="form-row">
            <div class="form-group">
              <label>性别</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="form.gender" value="male">
                  <span>男性</span>
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="form.gender" value="female">
                  <span>女性</span>
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label>年龄</label>
              <div class="input-with-unit">
                <input type="number" v-model.number="form.age" min="10" max="100" step="1">
                <span class="unit">岁</span>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>身高</label>
              <div class="input-with-unit">
                <input type="number" v-model.number="form.height" min="100" max="250" step="1">
                <span class="unit">厘米</span>
              </div>
            </div>
            
            <div class="form-group">
              <label>体重</label>
              <div class="input-with-unit">
                <input type="number" v-model.number="form.weight" min="30" max="200" step="0.1">
                <span class="unit">公斤</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>活动水平</label>
            <select v-model="form.activityLevel" class="select-input">
              <option v-for="option in activityLevelOptions" :key="option.value" :value="option.value">
                {{ option.label }} (×{{ getActivityMultiplier(option.value) }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>目标体重</label>
            <div class="input-with-unit">
              <input type="number" v-model.number="form.targetWeight" min="30" max="200" step="0.1">
              <span class="unit">公斤</span>
            </div>
            <p class="hint">理想体重范围：{{ idealWeightRange.min }} - {{ idealWeightRange.max }} 公斤</p>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>达成时间</label>
              <div class="input-with-unit">
                <input type="number" v-model.number="form.timeframeWeeks" min="1" max="52" step="1">
                <span class="unit">周</span>
              </div>
            </div>
            
            <div class="form-group">
              <label>当前季节</label>
              <select v-model="form.season" class="select-input">
                <option v-for="option in seasonOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </form>
      </section>

      <!-- 右侧：评估结果 -->
      <div class="results-section">
        <!-- 生物指标卡片 -->
        <section class="metrics-card card">
          <h3><i class="fas fa-chart-bar"></i> 生物指标</h3>
          <div class="metrics-grid">
            <div class="metric-item">
              <div class="metric-label">BMI</div>
              <div class="metric-value" :style="{ color: bmiColor }">
                {{ biologicalMetrics.bmi }}
                <span class="metric-category">({{ bmiLabel }})</span>
              </div>
              <div class="metric-range">正常范围：18.5 - 24.9</div>
            </div>
            
            <div class="metric-item">
              <div class="metric-label">基础代谢率</div>
              <div class="metric-value">{{ biologicalMetrics.bmr }}</div>
              <div class="metric-unit">千卡/天</div>
            </div>
            
            <div class="metric-item">
              <div class="metric-label">每日总消耗</div>
              <div class="metric-value">{{ biologicalMetrics.tdee }}</div>
              <div class="metric-unit">千卡/天</div>
            </div>
            
            <div class="metric-item">
              <div class="metric-label">最大心率</div>
              <div class="metric-value">{{ exerciseMetrics.mhr }}</div>
              <div class="metric-unit">次/分钟</div>
            </div>
            
            <div class="metric-item">
              <div class="metric-label">有氧区间</div>
              <div class="metric-value">{{ exerciseMetrics.aerobicZone.min }} - {{ exerciseMetrics.aerobicZone.max }}</div>
              <div class="metric-unit">次/分钟</div>
            </div>
            
            <div class="metric-item">
              <div class="metric-label">热量计划</div>
              <div class="metric-value" :class="{ 'positive': caloriePlan.dailyCalorieChange > 0, 'negative': caloriePlan.dailyCalorieChange < 0 }">
                {{ caloriePlan.dailyCalorieChange > 0 ? '+' : '' }}{{ caloriePlan.dailyCalorieChange }}
              </div>
              <div class="metric-unit">千卡/天</div>
            </div>
          </div>
        </section>

        <!-- 热量计划卡片 -->
        <section class="calorie-plan card">
          <h3><i class="fas fa-fire"></i> 热量计划</h3>
          <div class="plan-details">
            <p v-if="caloriePlan.dailyCalorieChange > 0">
              <strong>增重计划：</strong>每日需要增加 {{ caloriePlan.dailyCalorieChange }} 千卡摄入，
              预计每周增重 {{ caloriePlan.weeklyWeightChange }} 公斤。
            </p>
            <p v-else-if="caloriePlan.dailyCalorieChange < 0">
              <strong>减重计划：</strong>每日需要减少 {{ -caloriePlan.dailyCalorieChange }} 千卡摄入，
              预计每周减重 {{ -caloriePlan.weeklyWeightChange }} 公斤。
            </p>
            <p v-else>
              <strong>维持计划：</strong>当前体重与目标体重一致，建议维持每日 {{ biologicalMetrics.tdee }} 千卡摄入。
            </p>
          </div>
        </section>

        <!-- 健康建议卡片 -->
        <section class="recommendations-card card">
          <h3><i class="fas fa-lightbulb"></i> 健康建议</h3>
          <div class="recommendations-list">
            <div v-for="rec in recommendations" :key="rec.title" class="recommendation-item" :class="rec.type">
              <div class="rec-header">
                <i :class="{
                  'fas fa-exclamation-triangle': rec.type === 'warning',
                  'fas fa-info-circle': rec.type === 'suggestion',
                  'fas fa-check-circle': rec.type === 'success'
                }"></i>
                <h4>{{ rec.title }}</h4>
                <span class="priority">优先级：{{ rec.priority }}</span>
              </div>
              <p class="rec-description">{{ rec.description }}</p>
              <p class="rec-reason">{{ rec.reason }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.health-assessment { color: #111; }
.module-title { display: flex; align-items: center; gap: 0.5rem; margin: 0 0 0.5rem 0; font-size: 1.25rem; font-weight: 600; }
.module-desc { margin: 0 0 1.5rem 0; color: #666; font-size: 0.9rem; }

.assessment-layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 2rem;
}
@media (max-width: 900px) {
  .assessment-layout { grid-template-columns: 1fr; }
}

.card {
  background: #fff;
  padding: 1.5rem;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
}

.form-section h3, .metrics-card h3, .calorie-plan h3, .recommendations-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.health-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #444;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.input-with-unit {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.input-with-unit input {
  flex: 1;
  border: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  outline: none;
}

.input-with-unit .unit {
  padding: 0.5rem 0.75rem;
  background: #f5f5f5;
  color: #666;
  font-size: 0.85rem;
  border-left: 1px solid #ddd;
}

.select-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background: #fff;
  outline: none;
}

.hint {
  font-size: 0.8rem;
  color: #666;
  margin: 0.25rem 0 0 0;
}

/* 结果区域 */
.results-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.metric-item {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #eee;
}

.metric-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 0.25rem;
}

.metric-category {
  font-size: 0.85rem;
  font-weight: normal;
}

.metric-range, .metric-unit {
  font-size: 0.75rem;
  color: #888;
}

.positive { color: #4caf50 !important; }
.negative { color: #f44336 !important; }

/* 热量计划 */
.plan-details {
  font-size: 0.9rem;
  line-height: 1.5;
}

.plan-details strong {
  color: #111;
}

/* 建议列表 */
.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recommendation-item {
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #ddd;
}

.recommendation-item.warning {
  background: #fff3cd;
  border-left-color: #ffc107;
}

.recommendation-item.suggestion {
  background: #d1ecf1;
  border-left-color: #17a2b8;
}

.recommendation-item.success {
  background: #d4edda;
  border-left-color: #28a745;
}

.rec-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.rec-header i {
  font-size: 1rem;
}

.rec-header h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  flex: 1;
}

.priority {
  font-size: 0.75rem;
  color: #666;
  background: rgba(0,0,0,0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.rec-description {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #111;
}

.rec-reason {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
}
</style>